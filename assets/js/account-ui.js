(function () {
    'use strict';

    var DISPLAY_NAME_KEY = 'pc_profile_name';

    document.addEventListener('DOMContentLoaded', function () {
        initAccountUI();
    });

    function initAccountUI() {
        if (typeof window.pcSync === 'undefined') {
            console.error('Sync module not loaded');
            showError('Sync system unavailable. Please refresh.');
            return;
        }

        var exportBtn = document.getElementById('pc-export-btn');
        var importBtn = document.getElementById('pc-import-btn');
        var importFile = document.getElementById('pc-import-file');
        var emailInput = document.getElementById('pc-email-input');
        var sendLinkBtn = document.getElementById('pc-send-link-btn');
        var syncBtn = document.getElementById('pc-sync-btn');
        var logoutBtn = document.getElementById('pc-logout-btn');
        var saveNameBtn = document.getElementById('pc-save-name-btn');

        updateLocalDataDisplay();
        hydrateDisplayNameInput();
        updateAuthUI();

        if (exportBtn) {
            exportBtn.addEventListener('click', handleExport);
        }

        if (importBtn && importFile) {
            importBtn.addEventListener('click', function () {
                importFile.click();
            });
            importFile.addEventListener('change', handleImport);
        }

        if (sendLinkBtn && emailInput) {
            sendLinkBtn.addEventListener('click', handleSendLink);
        }

        if (syncBtn) {
            syncBtn.addEventListener('click', handleSync);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        if (saveNameBtn) {
            saveNameBtn.addEventListener('click', handleSaveDisplayName);
        }

        window.addEventListener('pc-auth-status-change', updateAuthUI);
        window.addEventListener('pc-auth-changed', updateAuthUI);

        if (window.pcSync && typeof window.pcSync.refreshCurrentUser === 'function') {
            window.pcSync.refreshCurrentUser().finally(updateAuthUI);
        }
    }

    function updateLocalDataDisplay() {
        var display = document.getElementById('pc-local-data');
        if (!display) {
            return;
        }

        var completedCount = getCompletedCaseCount();
        var streak = getCurrentStreak();

        display.innerHTML = [
            '<div class="pc-account-metric" role="listitem">',
            '<p class="pc-account-metric__label">Cases Completed</p>',
            '<p class="pc-account-metric__value">' + completedCount + '</p>',
            '</div>',
            '<div class="pc-account-metric" role="listitem">',
            '<p class="pc-account-metric__label">Study Streak</p>',
            '<p class="pc-account-metric__value">' + streak + ' day' + (streak === 1 ? '' : 's') + '</p>',
            '</div>'
        ].join('');
    }

    function getCompletedCaseCount() {
        if (window.pcStorage && typeof window.pcStorage.countCaseCompletions === 'function') {
            return window.pcStorage.countCaseCompletions();
        }

        var count = 0;
        try {
            for (var i = 0; i < localStorage.length; i += 1) {
                var key = localStorage.key(i);
                if (key && key.indexOf('pc_case_') === 0 && localStorage.getItem(key) === 'completed') {
                    count += 1;
                }
            }
        } catch (error) {
            return 0;
        }
        return count;
    }

    function getCurrentStreak() {
        if (window.pcStorage && typeof window.pcStorage.getCurrentStreak === 'function') {
            return window.pcStorage.getCurrentStreak();
        }

        try {
            var studyPlanRaw = localStorage.getItem('pc_study_plan') || '{}';
            var studyPlan = JSON.parse(studyPlanRaw);
            var streak = Number(studyPlan.currentStreak);
            return Number.isFinite(streak) && streak > 0 ? streak : 0;
        } catch (error) {
            return 0;
        }
    }

    function readStoredDisplayName() {
        try {
            return String(localStorage.getItem(DISPLAY_NAME_KEY) || '').trim();
        } catch (error) {
            return '';
        }
    }

    function writeStoredDisplayName(name) {
        try {
            var trimmed = String(name || '').trim();
            if (!trimmed) {
                localStorage.removeItem(DISPLAY_NAME_KEY);
                return true;
            }
            localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
            return true;
        } catch (error) {
            return false;
        }
    }

    function hydrateDisplayNameInput() {
        var input = document.getElementById('pc-display-name-input');
        if (!input) {
            return;
        }

        input.value = readStoredDisplayName();
        updateDisplayNameNote('Saved locally on this device.');
    }

    function updateDisplayNameNote(message, isError) {
        var note = document.getElementById('pc-display-name-note');
        if (!note) {
            return;
        }

        note.textContent = message || '';
        note.classList.remove('pc-is-error');
        note.classList.remove('pc-is-success');

        if (!message) {
            return;
        }

        note.classList.add(isError ? 'pc-is-error' : 'pc-is-success');
    }

    function getCurrentUser() {
        if (!window.pcSync || typeof window.pcSync.getCurrentUser !== 'function') {
            return null;
        }
        return window.pcSync.getCurrentUser();
    }

    function getDisplayNameForUser(user) {
        var localName = readStoredDisplayName();
        if (localName) {
            return localName;
        }

        if (user && user.user_metadata) {
            var profileName = user.user_metadata.display_name || user.user_metadata.full_name || user.user_metadata.name;
            if (profileName) {
                return String(profileName).trim();
            }
        }

        if (user && user.email) {
            return String(user.email).split('@')[0];
        }

        return 'Learner';
    }

    function updateAuthUI() {
        var user = getCurrentUser();
        var loggedInSection = document.getElementById('pc-logged-in-section');
        var loggedOutSection = document.getElementById('pc-logged-out-section');
        var statusDiv = document.getElementById('pc-account-status');
        var nameInput = document.getElementById('pc-display-name-input');

        if (nameInput && !nameInput.value) {
            nameInput.value = readStoredDisplayName();
        }

        if (user) {
            if (loggedInSection) {
                loggedInSection.hidden = false;
            }
            if (loggedOutSection) {
                loggedOutSection.hidden = true;
            }
            if (statusDiv) {
                var displayName = getDisplayNameForUser(user);
                statusDiv.innerHTML = '<p class="pc-status-success">Logged in as ' + escapeHtml(displayName) + '</p>';
            }

            var lastSync = getLastSyncTimestamp();
            var syncTimeDiv = document.getElementById('pc-last-sync');
            if (syncTimeDiv && lastSync) {
                syncTimeDiv.textContent = 'Last synced: ' + new Date(lastSync).toLocaleString();
            }
            return;
        }

        if (loggedInSection) {
            loggedInSection.hidden = true;
        }
        if (loggedOutSection) {
            loggedOutSection.hidden = false;
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<p class="pc-status-info">Working in local mode. Email login is optional for sync.</p>';
        }
    }

    function getLastSyncTimestamp() {
        if (window.pcStorage && typeof window.pcStorage.getLastSyncedAt === 'function') {
            return window.pcStorage.getLastSyncedAt() || '';
        }

        try {
            var meta = JSON.parse(localStorage.getItem('pc_sync_meta') || '{}');
            return meta.last_synced_at || localStorage.getItem('pc_last_sync') || '';
        } catch (error) {
            return localStorage.getItem('pc_last_sync') || '';
        }
    }

    async function syncDisplayNameToProfile(displayName) {
        var user = getCurrentUser();
        if (!user || !displayName) {
            return { ok: false, skipped: true };
        }

        if (typeof window.getSupabaseClient !== 'function') {
            return { ok: false, skipped: true };
        }

        var client = window.getSupabaseClient();
        if (!client || typeof client.from !== 'function') {
            return { ok: false, skipped: true };
        }

        try {
            var response = await client
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email || (user.id + '@local.invalid'),
                    display_name: displayName
                }, { onConflict: 'id' });

            if (response.error) {
                throw response.error;
            }

            if (client.auth && typeof client.auth.updateUser === 'function') {
                await client.auth.updateUser({
                    data: {
                        display_name: displayName,
                        name: displayName
                    }
                });
            }

            return { ok: true };
        } catch (error) {
            return { ok: false, error: error };
        }
    }

    async function handleSaveDisplayName() {
        var nameInput = document.getElementById('pc-display-name-input');
        if (!nameInput) {
            return;
        }

        var trimmed = String(nameInput.value || '').replace(/\s+/g, ' ').trim();
        if (!trimmed) {
            writeStoredDisplayName('');
            updateDisplayNameNote('Name cleared. You can continue in guest mode.', false);
            updateAuthUI();
            return;
        }

        if (trimmed.length < 2) {
            updateDisplayNameNote('Name should be at least 2 characters.', true);
            return;
        }

        if (!writeStoredDisplayName(trimmed)) {
            updateDisplayNameNote('Could not save name in this browser.', true);
            return;
        }

        var user = getCurrentUser();
        if (user) {
            var syncResult = await syncDisplayNameToProfile(trimmed);
            if (syncResult.ok) {
                updateDisplayNameNote('Name saved locally and synced to your profile.', false);
            } else {
                updateDisplayNameNote('Name saved locally. Profile sync can be retried later.', true);
            }
        } else {
            updateDisplayNameNote('Name saved locally. You can log in later to sync.', false);
        }

        updateAuthUI();
    }

    async function handleExport() {
        try {
            var data = exportDataBundle();
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'parth-portal-backup-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showSuccess('Data exported successfully');
        } catch (error) {
            showError('Export failed: ' + getErrorMessage(error));
        }
    }

    function exportDataBundle() {
        if (window.pcSync && typeof window.pcSync.exportAllData === 'function') {
            return window.pcSync.exportAllData();
        }

        if (window.pcStorage && typeof window.pcStorage.exportDataBundle === 'function') {
            return window.pcStorage.exportDataBundle();
        }

        var fallback = {};
        try {
            for (var i = 0; i < localStorage.length; i += 1) {
                var key = localStorage.key(i);
                if (key && key.indexOf('pc_') === 0) {
                    fallback[key] = localStorage.getItem(key);
                }
            }
        } catch (error) {
            // Keep local fallback best-effort.
        }
        return fallback;
    }

    async function handleImport(event) {
        var file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) {
            return;
        }

        try {
            var text = await file.text();
            var data = JSON.parse(text);

            if (window.confirm('This will merge imported data with existing data. Continue?')) {
                await importDataBundle(text, data);
                showSuccess('Data imported successfully');
                updateLocalDataDisplay();
                updateAuthUI();
            }
        } catch (error) {
            showError('Import failed: ' + getErrorMessage(error));
        } finally {
            if (event && event.target) {
                event.target.value = '';
            }
        }
    }

    async function importDataBundle(rawText, parsedData) {
        if (window.pcSync && typeof window.pcSync.importAllData === 'function') {
            window.pcSync.importAllData(rawText);
            return;
        }

        if (window.pcStorage && typeof window.pcStorage.importDataBundle === 'function') {
            window.pcStorage.importDataBundle(parsedData);
            return;
        }

        if (parsedData && typeof parsedData === 'object') {
            Object.keys(parsedData).forEach(function (key) {
                try {
                    localStorage.setItem(key, String(parsedData[key]));
                } catch (error) {
                    // Keep merge best-effort.
                }
            });
        }
    }

    async function handleSendLink() {
        var emailInput = document.getElementById('pc-email-input');
        var email = emailInput ? String(emailInput.value || '').trim() : '';
        var preferredName = readStoredDisplayName();

        if (!email || email.indexOf('@') === -1) {
            showError('Please enter a valid email address');
            return;
        }

        if (!window.pcSync || typeof window.pcSync.sendMagicLink !== 'function') {
            showError('Magic link is unavailable right now');
            return;
        }

        try {
            var options = {};
            if (preferredName) {
                options.metadata = {
                    display_name: preferredName,
                    name: preferredName
                };
            }

            var result = await window.pcSync.sendMagicLink(email, options);
            if (isSuccessResult(result)) {
                showSuccess('Magic link sent. Check your email.');
                emailInput.value = '';
            } else {
                showError('Failed to send link: ' + getErrorMessage(result && result.error));
            }
        } catch (error) {
            showError('Error: ' + getErrorMessage(error));
        }
    }

    async function handleSync() {
        if (!window.pcSync || typeof window.pcSync.syncToServer !== 'function') {
            showError('Sync is unavailable right now');
            return;
        }

        try {
            showStatus('Syncing...');
            if (typeof window.pcSync.syncFromServer === 'function') {
                await window.pcSync.syncFromServer();
            }

            var result = await window.pcSync.syncToServer({ trigger: 'manual_sync' });
            if (isSuccessResult(result)) {
                try {
                    localStorage.setItem('pc_last_sync', result.syncedAt || new Date().toISOString());
                } catch (error) {
                    // Ignore storage failures.
                }
                if (result && Array.isArray(result.warnings) && result.warnings.length) {
                    showStatus('Sync complete with warnings: ' + result.warnings.join(' '), 'info');
                } else {
                    showSuccess('Sync complete');
                }
                updateLocalDataDisplay();
                updateAuthUI();
            } else {
                if (isProfilesRlsError(result && result.error)) {
                    showError('Sync blocked by Supabase RLS on profiles. Add a profiles INSERT policy (auth.uid() = id) and retry.');
                    return;
                }
                if (isUserProgressForeignKeyError(result && result.error)) {
                    showError('Sync blocked: user_progress requires a matching profiles row for your user. Create/fix profile row and retry sync.');
                    return;
                }
                showError('Sync failed: ' + getErrorMessage(result && result.error));
            }
        } catch (error) {
            if (isProfilesRlsError(error)) {
                showError('Sync blocked by Supabase RLS on profiles. Add a profiles INSERT policy (auth.uid() = id) and retry.');
                return;
            }
            if (isUserProgressForeignKeyError(error)) {
                showError('Sync blocked: user_progress requires a matching profiles row for your user. Create/fix profile row and retry sync.');
                return;
            }
            showError('Sync error: ' + getErrorMessage(error));
        }
    }

    async function handleLogout() {
        if (!window.pcSync || typeof window.pcSync.signOut !== 'function') {
            showError('Logout is unavailable right now');
            return;
        }

        try {
            var result = await window.pcSync.signOut();
            if (isSuccessResult(result)) {
                showSuccess('Logged out successfully');
                updateAuthUI();
            } else {
                showError('Logout failed: ' + getErrorMessage(result && result.error));
            }
        } catch (error) {
            showError('Logout failed: ' + getErrorMessage(error));
        }
    }

    function isSuccessResult(result) {
        return !!(result && (result.success === true || result.ok === true));
    }

    function isProfilesRlsError(error) {
        var message = getErrorMessage(error).toLowerCase();
        return message.indexOf('row-level security') !== -1 && message.indexOf('profiles') !== -1;
    }

    function isUserProgressForeignKeyError(error) {
        if (!error) {
            return false;
        }

        var code = (error.code ? String(error.code) : '').toLowerCase();
        var message = getErrorMessage(error).toLowerCase();

        if (message.indexOf('user_progress_user_id_fkey') !== -1) {
            return true;
        }

        if (code === '23503' && message.indexOf('user_progress') !== -1) {
            return true;
        }

        return message.indexOf('foreign key') !== -1 &&
            message.indexOf('user_progress') !== -1 &&
            message.indexOf('profiles') !== -1;
    }

    function getErrorMessage(error) {
        if (!error) {
            return 'Unknown error';
        }
        if (typeof error === 'string') {
            return error;
        }
        if (error.message) {
            return String(error.message);
        }
        return String(error);
    }

    function showSuccess(message) {
        showStatus(message, 'success');
    }

    function showError(message) {
        showStatus(message, 'error');
    }

    function showStatus(message, type) {
        var statusDiv = document.getElementById('pc-account-status');
        if (!statusDiv) {
            return;
        }

        var kind = type || 'info';
        statusDiv.innerHTML = '<p class="pc-status-' + kind + '">' + escapeHtml(message) + '</p>';

        setTimeout(function () {
            if (statusDiv.textContent && statusDiv.textContent.indexOf(message) !== -1) {
                statusDiv.innerHTML = '';
            }
        }, 5000);
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = String(text || '');
        return div.innerHTML;
    }
})();
