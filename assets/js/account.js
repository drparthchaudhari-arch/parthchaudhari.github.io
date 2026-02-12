(function () {
    function getById(id) {
        return document.getElementById(id);
    }

    function formatDateTime(value) {
        if (!value) {
            return 'Never';
        }

        var date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'Never';
        }

        return date.toLocaleString();
    }

    function setMessage(message, type) {
        var node = getById('pc-account-message');
        if (!node) {
            return;
        }

        node.textContent = message || '';
        node.classList.remove('pc-is-error');
        node.classList.remove('pc-is-success');

        if (type === 'error') {
            node.classList.add('pc-is-error');
        } else if (type === 'success') {
            node.classList.add('pc-is-success');
        }
    }

    function getStorage() {
        return window.pcStorage || null;
    }

    function getSync() {
        return window.pcSync || null;
    }

    function isConfigured() {
        return typeof window.isSupabaseConfigured === 'function' && window.isSupabaseConfigured();
    }

    function getLocalStats() {
        var storage = getStorage();
        if (storage) {
            return {
                casesCompleted: typeof storage.countCaseCompletions === 'function' ? storage.countCaseCompletions() : 0,
                currentStreak: typeof storage.getCurrentStreak === 'function' ? storage.getCurrentStreak() : 0,
                lastSyncedAt: typeof storage.getLastSyncedAt === 'function' ? storage.getLastSyncedAt() : ''
            };
        }

        return {
            casesCompleted: 0,
            currentStreak: 0,
            lastSyncedAt: ''
        };
    }

    function renderLocalStats() {
        var stats = getLocalStats();
        var casesNode = getById('pc-local-cases');
        var streakNode = getById('pc-local-streak');

        if (casesNode) {
            if (casesNode.getAttribute('data-pc-value-only') === 'true') {
                casesNode.textContent = String(stats.casesCompleted);
                casesNode.setAttribute('aria-label', 'Cases completed: ' + stats.casesCompleted);
            } else {
                casesNode.textContent = 'Cases completed: ' + stats.casesCompleted;
            }
        }

        if (streakNode) {
            if (streakNode.getAttribute('data-pc-value-only') === 'true') {
                streakNode.textContent = stats.currentStreak + ' day' + (stats.currentStreak === 1 ? '' : 's');
                streakNode.setAttribute('aria-label', 'Current streak: ' + stats.currentStreak + ' days');
            } else {
                streakNode.textContent = 'Current streak: ' + stats.currentStreak + ' day' + (stats.currentStreak === 1 ? '' : 's');
            }
        }
    }

    function setSyncVisualState(stateName) {
        var section = getById('pc-sync-section');
        if (!section) {
            return;
        }

        section.classList.remove('pc-sync-state--unconfigured');
        section.classList.remove('pc-sync-state--logged-out');
        section.classList.remove('pc-sync-state--logged-in');
        section.classList.add(stateName);
    }

    function toDownloadFile(content, fileName, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function exportData() {
        var storage = getStorage();
        if (!storage || typeof storage.exportDataBundle !== 'function') {
            setMessage('Unable to export data in this browser session.', 'error');
            return;
        }

        try {
            var bundle = storage.exportDataBundle();
            var fileName = 'parthchaudhari-data-' + new Date().toISOString().slice(0, 10) + '.json';
            toDownloadFile(JSON.stringify(bundle, null, 2), fileName, 'application/json');
            setMessage('Data exported successfully.', 'success');
        } catch (error) {
            setMessage('Export failed. Please try again.', 'error');
        }
    }

    function parseJsonFile(file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function (event) {
                try {
                    resolve(JSON.parse(String(event.target && event.target.result ? event.target.result : '{}')));
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = function () {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    }

    function renderSyncState(snapshot) {
        var syncConfigured = isConfigured();
        var section = getById('pc-sync-section');
        var notConfigured = getById('pc-sync-not-configured');
        var loggedOut = getById('pc-sync-logged-out');
        var loggedIn = getById('pc-sync-logged-in');

        if (!section || !notConfigured || !loggedOut || !loggedIn) {
            return;
        }

        if (!syncConfigured) {
            setSyncVisualState('pc-sync-state--unconfigured');
            section.hidden = false;
            notConfigured.hidden = false;
            loggedOut.hidden = true;
            loggedIn.hidden = true;
            return;
        }

        var user = snapshot && snapshot.user ? snapshot.user : (getSync() && typeof getSync().getCurrentUser === 'function' ? getSync().getCurrentUser() : null);
        var stats = getLocalStats();

        notConfigured.hidden = true;

        if (!user) {
            setSyncVisualState('pc-sync-state--logged-out');
            loggedOut.hidden = false;
            loggedIn.hidden = true;
            return;
        }

        setSyncVisualState('pc-sync-state--logged-in');
        loggedOut.hidden = true;
        loggedIn.hidden = false;

        var welcome = getById('pc-sync-welcome');
        var lastSynced = getById('pc-sync-last-synced');
        if (welcome) {
            welcome.textContent = 'Welcome back, ' + (user.email || 'Learner');
        }

        if (lastSynced) {
            var syncedAt = snapshot && snapshot.lastSyncedAt ? snapshot.lastSyncedAt : stats.lastSyncedAt;
            lastSynced.textContent = formatDateTime(syncedAt);
        }
    }

    async function importDataFromFile(event) {
        var target = event.target;
        var file = target && target.files && target.files[0] ? target.files[0] : null;
        if (!file) {
            return;
        }

        try {
            var payload = await parseJsonFile(file);
            var storage = getStorage();
            if (!storage || typeof storage.importDataBundle !== 'function') {
                setMessage('Import is unavailable in this browser session.', 'error');
                return;
            }

            var result = storage.importDataBundle(payload);
            renderLocalStats();
            renderSyncState();

            if (result && result.success) {
                setMessage('Import complete. ' + result.imported + ' keys updated.', 'success');

                var sync = getSync();
                if (sync && typeof sync.syncToServer === 'function') {
                    sync.syncToServer({ trigger: 'import' }).catch(function () {
                        // Keep import local-first even if sync fails.
                    });
                }
            } else {
                setMessage('Import file did not contain valid data.', 'error');
            }
        } catch (error) {
            setMessage('Invalid JSON file. Please upload a valid export.', 'error');
        } finally {
            target.value = '';
        }
    }

    async function sendMagicLink() {
        var emailInput = getById('pc-sync-email');
        var email = emailInput ? String(emailInput.value || '').trim() : '';

        if (!email) {
            setMessage('Enter your email address first.', 'error');
            return;
        }

        var sync = getSync();
        if (!sync || typeof sync.sendMagicLink !== 'function') {
            setMessage('Sync service is unavailable right now.', 'error');
            return;
        }

        setMessage('Sending magic link...', '');
        var result = await sync.sendMagicLink(email);

        if (result && result.ok) {
            setMessage('Magic link sent. Check your inbox.', 'success');
            return;
        }

        setMessage('Failed to send magic link. Please verify email auth settings in Supabase.', 'error');
    }

    async function syncNow() {
        var sync = getSync();
        if (!sync || typeof sync.syncToServer !== 'function') {
            setMessage('Sync service is unavailable right now.', 'error');
            return;
        }

        setMessage('Syncing...', '');

        try {
            if (typeof sync.syncFromServer === 'function') {
                await sync.syncFromServer();
            }
            var result = await sync.syncToServer({ trigger: 'manual_sync' });

            if (result && result.ok) {
                renderLocalStats();
                renderSyncState();
                setMessage('Sync complete.', 'success');
            } else {
                setMessage('Sync skipped or failed. Local mode is still active.', 'error');
            }
        } catch (error) {
            setMessage('Sync failed. Local mode is still active.', 'error');
        }
    }

    async function logout() {
        var sync = getSync();
        if (!sync || typeof sync.signOut !== 'function') {
            setMessage('Sync service is unavailable right now.', 'error');
            return;
        }

        var result = await sync.signOut();
        if (result && result.ok) {
            setMessage('Logged out. You are in anonymous mode.', 'success');
            renderSyncState({ loggedIn: false, user: null, lastSyncedAt: '' });
            return;
        }

        setMessage('Logout failed. Please try again.', 'error');
    }

    function bindEvents() {
        var exportButton = getById('pc-export-button');
        var importButton = getById('pc-import-button');
        var importInput = getById('pc-import-input');
        var magicLinkButton = getById('pc-send-magic-link');
        var syncNowButton = getById('pc-sync-now');
        var logoutButton = getById('pc-logout');

        if (exportButton) {
            exportButton.addEventListener('click', exportData);
        }

        if (importButton && importInput) {
            importButton.addEventListener('click', function () {
                importInput.click();
            });
        }

        if (importInput) {
            importInput.addEventListener('change', importDataFromFile);
        }

        if (magicLinkButton) {
            magicLinkButton.addEventListener('click', function (event) {
                event.preventDefault();
                sendMagicLink();
            });
        }

        if (syncNowButton) {
            syncNowButton.addEventListener('click', function () {
                syncNow();
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', function () {
                logout();
            });
        }
    }

    function init() {
        var root = getById('pc-account-root');
        if (!root) {
            return;
        }

        bindEvents();
        renderLocalStats();
        renderSyncState();

        var sync = getSync();
        if (sync && typeof sync.onAuthStateChange === 'function') {
            sync.onAuthStateChange(function (snapshot) {
                renderLocalStats();
                renderSyncState(snapshot);
            });
        }

        if (sync && typeof sync.refreshCurrentUser === 'function') {
            sync.refreshCurrentUser().then(function () {
                renderSyncState();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
