(function () {
    var RETRY_QUEUE_KEY = 'pc_sync_retry_queue';
    var AUTH_STATE_KEY = 'pc_sync_auth_state';
    var SYNC_META_KEY = 'pc_sync_meta';
    var PERIODIC_SYNC_MS = 5 * 60 * 1000;
    var RETRY_POLL_MS = 60 * 1000;

    var state = {
        currentUser: null,
        listeners: [],
        authSubscription: null,
        periodicTimer: null,
        retryTimer: null,
        initialized: false,
        authInitialized: false,
        syncInFlight: false
    };

    function safeParse(value, fallback) {
        if (!value) {
            return fallback;
        }

        try {
            var parsed = JSON.parse(value);
            return parsed !== undefined ? parsed : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function isObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value);
    }

    function cloneValue(value, fallback) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return fallback;
        }
    }

    function safeGetItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            return false;
        }
    }

    function toTimestamp(value) {
        var time = Date.parse(value || '');
        return Number.isFinite(time) ? time : 0;
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function getStorageApi() {
        return window.pcStorage || null;
    }

    function isSupabaseConfigured() {
        return typeof window.isSupabaseConfigured === 'function' && window.isSupabaseConfigured();
    }

    function getSupabaseClient() {
        if (typeof window.getSupabaseClient !== 'function') {
            return null;
        }
        return window.getSupabaseClient();
    }

    function getLastSyncedAt() {
        var storage = getStorageApi();
        if (storage && typeof storage.getLastSyncedAt === 'function') {
            return storage.getLastSyncedAt() || '';
        }

        var meta = safeParse(safeGetItem(SYNC_META_KEY), {});
        return meta && typeof meta === 'object' ? (meta.last_synced_at || '') : '';
    }

    function getStatusSnapshot() {
        return {
            loggedIn: !!state.currentUser,
            user: state.currentUser || null,
            lastSyncedAt: getLastSyncedAt()
        };
    }

    function dispatchStatusChange() {
        var snapshot = getStatusSnapshot();

        for (var i = 0; i < state.listeners.length; i += 1) {
            try {
                state.listeners[i](snapshot);
            } catch (error) {
                // Keep listener failures isolated.
            }
        }

        if (typeof window.CustomEvent === 'function') {
            window.dispatchEvent(new CustomEvent('pc-auth-status-change', { detail: snapshot }));
        }
    }

    function setCachedAuthState(loggedIn) {
        safeSetItem(AUTH_STATE_KEY, loggedIn ? 'signed_in' : 'signed_out');
    }

    function getRetryQueue() {
        var parsed = safeParse(safeGetItem(RETRY_QUEUE_KEY), []);
        return Array.isArray(parsed) ? parsed : [];
    }

    function saveRetryQueue(queue) {
        return safeSetItem(RETRY_QUEUE_KEY, JSON.stringify(Array.isArray(queue) ? queue : []));
    }

    function queueRetry(reason) {
        var queue = getRetryQueue();
        queue.push({
            reason: reason || 'sync_failure',
            queuedAt: nowIso()
        });

        if (queue.length > 25) {
            queue = queue.slice(queue.length - 25);
        }

        saveRetryQueue(queue);
    }

    function clearRetryQueue() {
        saveRetryQueue([]);
    }

    function shouldQueueForRetry(error) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return true;
        }

        var message = String((error && error.message) || '').toLowerCase();
        return message.indexOf('network') !== -1 ||
            message.indexOf('fetch') !== -1 ||
            message.indexOf('timeout') !== -1 ||
            message.indexOf('failed') !== -1;
    }

    function unwrapSyncField(value) {
        if (isObject(value) && isObject(value.data)) {
            return {
                data: cloneValue(value.data, {}),
                updatedAt: value.updatedAt || value.updated_at || ''
            };
        }

        if (isObject(value)) {
            return {
                data: cloneValue(value, {}),
                updatedAt: value.updatedAt || value.updated_at || ''
            };
        }

        return {
            data: {},
            updatedAt: ''
        };
    }

    function mergeObjectsNeverDelete(olderValue, newerValue) {
        if (Array.isArray(newerValue)) {
            return cloneValue(newerValue, []);
        }

        if (isObject(olderValue) && isObject(newerValue)) {
            var merged = cloneValue(olderValue, {});
            var keys = Object.keys(newerValue);
            for (var i = 0; i < keys.length; i += 1) {
                var key = keys[i];
                merged[key] = mergeObjectsNeverDelete(olderValue[key], newerValue[key]);
            }
            return merged;
        }

        if (newerValue === undefined || newerValue === null) {
            return cloneValue(olderValue, olderValue);
        }

        return cloneValue(newerValue, newerValue);
    }

    function mergeField(localField, serverField) {
        var local = unwrapSyncField(localField);
        var server = unwrapSyncField(serverField);
        var localTime = toTimestamp(local.updatedAt);
        var serverTime = toTimestamp(server.updatedAt);
        var isServerNewer = serverTime > localTime;

        var olderData = isServerNewer ? local.data : server.data;
        var newerData = isServerNewer ? server.data : local.data;
        var mergedData = mergeObjectsNeverDelete(olderData, newerData);
        var updatedAt = isServerNewer ? (server.updatedAt || local.updatedAt || '') : (local.updatedAt || server.updatedAt || '');

        return {
            data: mergedData,
            updatedAt: updatedAt
        };
    }

    function pickLatestTimestamp(values) {
        var latest = '';
        var latestValue = 0;

        for (var i = 0; i < values.length; i += 1) {
            var value = values[i];
            var stamp = toTimestamp(value);
            if (stamp > latestValue) {
                latestValue = stamp;
                latest = value;
            }
        }

        return latest;
    }

    function mergeData(localData, serverData) {
        var safeLocal = isObject(localData) ? localData : {};
        var safeServer = isObject(serverData) ? serverData : {};
        var mergedCase = mergeField(safeLocal.case_completions, safeServer.case_completions);
        var mergedStudy = mergeField(safeLocal.study_plan, safeServer.study_plan);
        var mergedGame = mergeField(safeLocal.game_activity, safeServer.game_activity);
        var mergedUpdatedAt = pickLatestTimestamp([
            safeLocal.updated_at,
            safeServer.updated_at,
            mergedCase.updatedAt,
            mergedStudy.updatedAt,
            mergedGame.updatedAt
        ]);

        return {
            case_completions: mergedCase,
            study_plan: mergedStudy,
            game_activity: mergedGame,
            updated_at: mergedUpdatedAt
        };
    }

    function buildFallbackLocalPayload() {
        var caseCompletions = {};

        try {
            for (var i = 0; i < localStorage.length; i += 1) {
                var key = localStorage.key(i);
                if (key && key.indexOf('pc_case_') === 0 && localStorage.getItem(key) === 'completed') {
                    caseCompletions[key] = 'completed';
                }
            }
        } catch (error) {
            // Ignore localStorage access errors.
        }

        var studyPlan = safeParse(safeGetItem('pc_study_plan'), {});
        var gameActivity = safeParse(safeGetItem('pc_game_activity'), {});
        var meta = safeParse(safeGetItem(SYNC_META_KEY), {});

        return {
            case_completions: {
                data: isObject(caseCompletions) ? caseCompletions : {},
                updatedAt: meta.case_completions || ''
            },
            study_plan: {
                data: isObject(studyPlan) ? studyPlan : {},
                updatedAt: meta.study_plan || ''
            },
            game_activity: {
                data: isObject(gameActivity) ? gameActivity : {},
                updatedAt: meta.game_activity || ''
            },
            updated_at: meta.updated_at || ''
        };
    }

    function getLocalPayload() {
        var storage = getStorageApi();
        if (storage && typeof storage.buildLocalSyncPayload === 'function') {
            return storage.buildLocalSyncPayload();
        }
        return buildFallbackLocalPayload();
    }

    function applyMergedPayload(mergedPayload) {
        var storage = getStorageApi();
        if (storage && typeof storage.applySyncData === 'function') {
            storage.applySyncData(mergedPayload);
            return true;
        }

        var mergedCases = unwrapSyncField(mergedPayload.case_completions).data;
        var caseKeys = Object.keys(mergedCases);
        for (var i = 0; i < caseKeys.length; i += 1) {
            var key = caseKeys[i];
            var value = mergedCases[key];
            if (key.indexOf('pc_case_') === 0 && (value === true || value === 'completed')) {
                safeSetItem(key, 'completed');
            }
        }

        var mergedStudy = unwrapSyncField(mergedPayload.study_plan).data;
        if (isObject(mergedStudy) && Object.keys(mergedStudy).length) {
            safeSetItem('pc_study_plan', JSON.stringify(mergedStudy));
        }

        var mergedGame = unwrapSyncField(mergedPayload.game_activity).data;
        if (isObject(mergedGame) && Object.keys(mergedGame).length) {
            safeSetItem('pc_game_activity', JSON.stringify(mergedGame));
        }

        return true;
    }

    function getDisplayName(user) {
        if (!user || typeof user !== 'object') {
            return 'Anonymous';
        }

        var metaName = user.user_metadata && (user.user_metadata.display_name || user.user_metadata.full_name || user.user_metadata.name);
        if (metaName) {
            return String(metaName);
        }

        if (user.email) {
            return String(user.email).split('@')[0];
        }

        return 'Anonymous';
    }

    function getLeaderboardStats(payload) {
        var caseData = unwrapSyncField(payload.case_completions).data;
        var studyData = unwrapSyncField(payload.study_plan).data;
        var completionCount = isObject(caseData) ? Object.keys(caseData).length : 0;
        var currentStreak = studyData && Number.isFinite(Number(studyData.currentStreak))
            ? Math.max(0, Number(studyData.currentStreak))
            : 0;
        var weeklyScore = (completionCount * 10) + (currentStreak * 2);

        return {
            completionCount: completionCount,
            currentStreak: currentStreak,
            weeklyScore: weeklyScore
        };
    }

    function getErrorCode(error) {
        if (!error || typeof error !== 'object') {
            return '';
        }

        if (error.code) {
            return String(error.code);
        }

        return '';
    }

    function getErrorMessage(error) {
        if (!error) {
            return '';
        }

        if (typeof error === 'string') {
            return error;
        }

        if (error.message) {
            return String(error.message);
        }

        return String(error);
    }

    function isRlsViolation(error, tableName) {
        var code = getErrorCode(error);
        if (code === '42501') {
            return true;
        }

        var message = getErrorMessage(error).toLowerCase();
        if (!message) {
            return false;
        }

        if (message.indexOf('row-level security') !== -1) {
            if (!tableName) {
                return true;
            }
            return message.indexOf(String(tableName).toLowerCase()) !== -1;
        }

        return false;
    }

    async function ensureProfile(client, user) {
        if (!client || !user) {
            return {
                ok: false,
                skipped: true
            };
        }

        var payload = {
            id: user.id,
            email: user.email || (user.id + '@local.invalid'),
            display_name: getDisplayName(user)
        };

        var response = await client.from('profiles').upsert(payload, { onConflict: 'id' });
        if (response.error) {
            return {
                ok: false,
                error: response.error
            };
        }

        return {
            ok: true
        };
    }

    async function upsertLeaderboard(client, user, payload, updatedAt) {
        var stats = getLeaderboardStats(payload);
        var row = {
            user_id: user.id,
            display_name: getDisplayName(user),
            weekly_score: stats.weeklyScore,
            current_streak: stats.currentStreak,
            total_completions: stats.completionCount,
            updated_at: updatedAt
        };

        var existing = await client.from('leaderboard')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

        if (existing.error && existing.error.code !== 'PGRST116') {
            throw existing.error;
        }

        if (existing.data && existing.data.id) {
            var updateResult = await client.from('leaderboard')
                .update(row)
                .eq('id', existing.data.id);
            if (updateResult.error) {
                throw updateResult.error;
            }
            return;
        }

        var insertResult = await client.from('leaderboard').insert(row);
        if (insertResult.error) {
            throw insertResult.error;
        }
    }

    async function refreshCurrentUser() {
        if (!isSupabaseConfigured()) {
            state.currentUser = null;
            setCachedAuthState(false);
            dispatchStatusChange();
            return null;
        }

        var client = getSupabaseClient();
        if (!client || !client.auth || typeof client.auth.getUser !== 'function') {
            state.currentUser = null;
            setCachedAuthState(false);
            dispatchStatusChange();
            return null;
        }

        try {
            var response = await client.auth.getUser();
            if (response.error) {
                throw response.error;
            }

            state.currentUser = response.data && response.data.user ? response.data.user : null;
            setCachedAuthState(!!state.currentUser);
            dispatchStatusChange();
            return state.currentUser;
        } catch (error) {
            state.currentUser = null;
            setCachedAuthState(false);
            dispatchStatusChange();
            return null;
        }
    }

    async function resolveCurrentUser() {
        if (state.currentUser) {
            return state.currentUser;
        }
        return refreshCurrentUser();
    }

    function getCurrentUser() {
        return state.currentUser || null;
    }

    async function syncToServer(options) {
        if (!isSupabaseConfigured()) {
            return {
                ok: false,
                skipped: true,
                reason: 'not_configured'
            };
        }

        var client = getSupabaseClient();
        if (!client) {
            return {
                ok: false,
                skipped: true,
                reason: 'client_unavailable'
            };
        }

        var user = await resolveCurrentUser();
        if (!user) {
            return {
                ok: false,
                skipped: true,
                reason: 'not_logged_in'
            };
        }

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            queueRetry('offline_sync_to_server');
            return {
                ok: false,
                queued: true,
                reason: 'offline'
            };
        }

        if (state.syncInFlight) {
            return {
                ok: false,
                skipped: true,
                reason: 'sync_in_flight'
            };
        }

        state.syncInFlight = true;

        try {
            var localPayload = getLocalPayload();
            var updatedAt = nowIso();
            var warnings = [];

            var profileResult = await ensureProfile(client, user);
            if (!profileResult.ok) {
                if (profileResult.error && isRlsViolation(profileResult.error, 'profiles')) {
                    return {
                        ok: false,
                        error: {
                            code: getErrorCode(profileResult.error) || 'PROFILE_RLS_BLOCKED',
                            message: 'Sync blocked: profiles row could not be created due RLS policy. Run sync RLS hotfix migration and retry.'
                        }
                    };
                }

                return {
                    ok: false,
                    error: profileResult.error || {
                        code: 'PROFILE_UPSERT_FAILED',
                        message: 'Sync blocked: unable to create profile row required before writing user_progress.'
                    }
                };
            }

            var progressPayload = {
                user_id: user.id,
                case_completions: {
                    data: localPayload.case_completions && localPayload.case_completions.data ? localPayload.case_completions.data : {},
                    updatedAt: updatedAt
                },
                study_plan: {
                    data: localPayload.study_plan && localPayload.study_plan.data ? localPayload.study_plan.data : {},
                    updatedAt: updatedAt
                },
                game_activity: {
                    data: localPayload.game_activity && localPayload.game_activity.data ? localPayload.game_activity.data : {},
                    updatedAt: updatedAt
                },
                updated_at: updatedAt
            };

            var progressResult = await client.from('user_progress')
                .upsert(progressPayload, { onConflict: 'user_id' });

            if (progressResult.error) {
                throw progressResult.error;
            }

            try {
                await upsertLeaderboard(client, user, localPayload, updatedAt);
            } catch (leaderboardError) {
                if (isRlsViolation(leaderboardError, 'leaderboard')) {
                    warnings.push('Leaderboard sync skipped due leaderboard table RLS policy.');
                } else {
                    warnings.push('Leaderboard sync skipped: ' + getErrorMessage(leaderboardError));
                }
            }

            var storage = getStorageApi();
            if (storage && typeof storage.setLastSyncedAt === 'function') {
                storage.setLastSyncedAt(updatedAt);
            }

            clearRetryQueue();
            dispatchStatusChange();

            return {
                ok: true,
                syncedAt: updatedAt,
                trigger: options && options.trigger ? options.trigger : 'manual',
                warnings: warnings
            };
        } catch (error) {
            if (shouldQueueForRetry(error)) {
                queueRetry('sync_to_server_failed');
            }
            return {
                ok: false,
                error: error
            };
        } finally {
            state.syncInFlight = false;
        }
    }

    async function syncFromServer() {
        if (!isSupabaseConfigured()) {
            return {
                ok: false,
                skipped: true,
                reason: 'not_configured'
            };
        }

        var client = getSupabaseClient();
        if (!client) {
            return {
                ok: false,
                skipped: true,
                reason: 'client_unavailable'
            };
        }

        var user = await resolveCurrentUser();
        if (!user) {
            return {
                ok: false,
                skipped: true,
                reason: 'not_logged_in'
            };
        }

        try {
            var response = await client.from('user_progress')
                .select('case_completions, study_plan, game_activity, updated_at')
                .eq('user_id', user.id)
                .maybeSingle();

            if (response.error && response.error.code !== 'PGRST116') {
                throw response.error;
            }

            var localPayload = getLocalPayload();
            var serverPayload = response.data ? {
                case_completions: response.data.case_completions || {},
                study_plan: response.data.study_plan || {},
                game_activity: response.data.game_activity || {},
                updated_at: response.data.updated_at || ''
            } : {};

            var mergedPayload = mergeData(localPayload, serverPayload);
            applyMergedPayload(mergedPayload);

            var mergedAt = nowIso();
            var storage = getStorageApi();
            if (storage && typeof storage.setLastSyncedAt === 'function') {
                storage.setLastSyncedAt(mergedAt);
            }

            dispatchStatusChange();

            return {
                ok: true,
                merged: mergedPayload,
                hasServerData: !!response.data
            };
        } catch (error) {
            if (shouldQueueForRetry(error)) {
                queueRetry('sync_from_server_failed');
            }
            return {
                ok: false,
                error: error
            };
        }
    }

    async function flushRetryQueue() {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return {
                ok: false,
                skipped: true,
                reason: 'offline'
            };
        }

        var queue = getRetryQueue();
        if (!queue.length) {
            return {
                ok: true,
                flushed: 0
            };
        }

        var result = await syncToServer({ trigger: 'retry_queue' });
        if (result && result.ok) {
            return {
                ok: true,
                flushed: queue.length
            };
        }

        return result;
    }

    function runBackgroundSync(trigger) {
        syncToServer({ trigger: trigger || 'background' }).catch(function () {
            // Background sync should never interrupt UI flows.
        });
    }

    async function sendMagicLink(email, options) {
        var trimmedEmail = String(email || '').trim();
        if (!trimmedEmail) {
            return {
                ok: false,
                error: new Error('Email is required')
            };
        }

        if (!isSupabaseConfigured()) {
            return {
                ok: false,
                error: new Error('Sync not configured')
            };
        }

        var client = getSupabaseClient();
        if (!client || !client.auth || typeof client.auth.signInWithOtp !== 'function') {
            return {
                ok: false,
                error: new Error('Supabase auth is unavailable')
            };
        }

        try {
            var redirectTo = window.location.origin + '/account/';
            var metadata = null;
            if (options && typeof options === 'object' && options.redirectTo) {
                var customRedirect = String(options.redirectTo).trim();
                if (customRedirect) {
                    redirectTo = customRedirect;
                }
            }

            if (options && typeof options === 'object' && options.metadata && typeof options.metadata === 'object') {
                metadata = options.metadata;
            }

            if (!metadata && options && typeof options === 'object' && options.displayName) {
                var displayName = String(options.displayName).trim();
                if (displayName) {
                    metadata = {
                        display_name: displayName,
                        name: displayName
                    };
                }
            }

            var otpOptions = {
                emailRedirectTo: redirectTo
            };

            if (metadata) {
                otpOptions.data = metadata;
            }

            function isRedirectPolicyError(error) {
                var message = getErrorMessage(error).toLowerCase();
                return message.indexOf('redirect') !== -1 ||
                    message.indexOf('not allowed') !== -1 ||
                    message.indexOf('site url') !== -1 ||
                    message.indexOf('invalid') !== -1;
            }

            async function sendWithRedirect(redirectUrl) {
                var localOptions = {
                    emailRedirectTo: redirectUrl
                };

                if (metadata) {
                    localOptions.data = metadata;
                }

                return client.auth.signInWithOtp({
                    email: trimmedEmail,
                    options: localOptions
                });
            }

            var response = await sendWithRedirect(redirectTo);
            if (response.error) {
                var fallbackRedirect = window.location.origin + '/account/';
                if (redirectTo !== fallbackRedirect && isRedirectPolicyError(response.error)) {
                    var fallbackResponse = await sendWithRedirect(fallbackRedirect);
                    if (fallbackResponse.error) {
                        throw fallbackResponse.error;
                    }

                    return {
                        ok: true,
                        redirectFallback: true
                    };
                }

                throw response.error;
            }

            return {
                ok: true
            };
        } catch (error) {
            return {
                ok: false,
                error: error
            };
        }
    }

    async function signOut() {
        if (!isSupabaseConfigured()) {
            state.currentUser = null;
            setCachedAuthState(false);
            dispatchStatusChange();
            return {
                ok: true,
                skipped: true
            };
        }

        var client = getSupabaseClient();
        if (!client || !client.auth || typeof client.auth.signOut !== 'function') {
            return {
                ok: false,
                error: new Error('Supabase auth is unavailable')
            };
        }

        try {
            var response = await client.auth.signOut();
            if (response.error) {
                throw response.error;
            }

            state.currentUser = null;
            setCachedAuthState(false);
            dispatchStatusChange();

            return {
                ok: true
            };
        } catch (error) {
            return {
                ok: false,
                error: error
            };
        }
    }

    function onAuthStateChange(callback) {
        if (typeof callback !== 'function') {
            return function () { };
        }

        state.listeners.push(callback);

        try {
            callback(getStatusSnapshot());
        } catch (error) {
            // Listener callback errors are isolated.
        }

        return function () {
            state.listeners = state.listeners.filter(function (listener) {
                return listener !== callback;
            });
        };
    }

    function startPeriodicSync() {
        if (state.periodicTimer) {
            return;
        }

        state.periodicTimer = window.setInterval(function () {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                return;
            }
            if (!state.currentUser) {
                return;
            }
            runBackgroundSync('periodic');
        }, PERIODIC_SYNC_MS);
    }

    function startRetryPoll() {
        if (state.retryTimer) {
            return;
        }

        state.retryTimer = window.setInterval(function () {
            flushRetryQueue().catch(function () {
                // Retry errors are handled per-attempt.
            });
        }, RETRY_POLL_MS);
    }

    function handleAuthEvent(event, session) {
        state.currentUser = session && session.user ? session.user : null;
        setCachedAuthState(!!state.currentUser);
        dispatchStatusChange();

        if (!state.currentUser) {
            return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            syncFromServer()
                .then(function () {
                    return syncToServer({ trigger: 'login' });
                })
                .then(function () {
                    return flushRetryQueue();
                })
                .catch(function () {
                    // Login flow should not break the page on sync issues.
                });
        }
    }

    function initAuthListener() {
        if (state.authInitialized) {
            return;
        }
        state.authInitialized = true;

        if (!isSupabaseConfigured()) {
            state.currentUser = null;
            setCachedAuthState(false);
            dispatchStatusChange();
            return;
        }

        var client = getSupabaseClient();
        if (!client || !client.auth || typeof client.auth.onAuthStateChange !== 'function') {
            return;
        }

        var subscriptionHandle = client.auth.onAuthStateChange(handleAuthEvent);
        if (subscriptionHandle && subscriptionHandle.data && subscriptionHandle.data.subscription) {
            state.authSubscription = subscriptionHandle.data.subscription;
        }

        refreshCurrentUser().then(function (user) {
            if (user) {
                syncFromServer()
                    .then(function () {
                        return syncToServer({ trigger: 'initial_load' });
                    })
                    .catch(function () {
                        // Initial sync is best-effort.
                    });
            }
        });
    }

    function init() {
        if (state.initialized) {
            return;
        }
        state.initialized = true;

        if (!isSupabaseConfigured()) {
            state.currentUser = null;
            setCachedAuthState(false);
            dispatchStatusChange();
            return;
        }

        initAuthListener();
        startPeriodicSync();
        startRetryPoll();

        window.addEventListener('online', function () {
            flushRetryQueue().catch(function () {
                // Ignore retry errors in online handler.
            });
        });
    }

    window.pcSync = {
        syncToServer: syncToServer,
        syncFromServer: syncFromServer,
        mergeData: mergeData,
        onAuthStateChange: onAuthStateChange,
        getCurrentUser: getCurrentUser,
        refreshCurrentUser: refreshCurrentUser,
        flushRetryQueue: flushRetryQueue,
        sendMagicLink: sendMagicLink,
        signOut: signOut
    };

    window.syncToServer = syncToServer;
    window.syncFromServer = syncFromServer;
    window.mergeData = mergeData;
    window.onAuthStateChange = onAuthStateChange;
    window.getCurrentUser = getCurrentUser;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
