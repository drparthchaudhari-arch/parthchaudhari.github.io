(function () {
    var GAME_ACTIVITY_KEY = 'pc_game_activity';
    var GAME_ALIASES = {
        memory: 'memory-match',
        'tic-tac-toe': 'tictactoe',
        iq: 'iq-challenge',
        iqchallenge: 'iq-challenge'
    };

    function normalizeGameId(rawId) {
        if (!rawId) {
            return '';
        }
        var normalized = String(rawId).toLowerCase().trim();
        if (GAME_ALIASES[normalized]) {
            return GAME_ALIASES[normalized];
        }
        return normalized;
    }

    function safeParse(value, fallback) {
        if (!value) {
            return fallback;
        }

        try {
            var parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
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

    function getGameActivity() {
        return safeParse(safeGetItem(GAME_ACTIVITY_KEY), {});
    }

    function saveGameActivity(activity) {
        return safeSetItem(GAME_ACTIVITY_KEY, JSON.stringify(activity));
    }

    function toDayStamp(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function isToday(isoString) {
        if (!isoString) {
            return false;
        }

        var date = new Date(isoString);
        if (Number.isNaN(date.getTime())) {
            return false;
        }

        return toDayStamp(date) === toDayStamp(new Date());
    }

    function inferLaunchGameId() {
        var bodyId = document.body ? document.body.getAttribute('data-pc-game-id') : '';
        if (bodyId) {
            return normalizeGameId(bodyId);
        }

        var path = window.location.pathname || '';
        var match = path.match(/^\/play\/([^/]+)\/?$/);
        if (!match || !match[1]) {
            return '';
        }

        return normalizeGameId(match[1]);
    }

    function trackGameLaunch() {
        var gameId = inferLaunchGameId();
        if (!gameId) {
            return;
        }

        var activity = getGameActivity();
        var entry = activity[gameId] || {};
        var currentCount = Number(entry.playCount);

        entry.playCount = Number.isFinite(currentCount) ? currentCount + 1 : 1;
        entry.lastPlayed = new Date().toISOString();

        activity[gameId] = entry;
        saveGameActivity(activity);
    }

    function getCardGameId(card) {
        if (!card) {
            return '';
        }
        var value = card.getAttribute('data-pc-game-id') || '';
        return normalizeGameId(value);
    }

    function updatePlayedTodayBadges() {
        var cards = document.querySelectorAll('[data-pc-game-card]');
        if (!cards.length) {
            return;
        }

        var activity = getGameActivity();

        for (var i = 0; i < cards.length; i += 1) {
            var card = cards[i];
            var badge = card.querySelector('[data-pc-played-badge]');
            if (!badge) {
                continue;
            }

            var gameId = getCardGameId(card);
            var entry = activity[gameId];

            if (!entry || !isToday(entry.lastPlayed)) {
                badge.hidden = true;
                continue;
            }

            badge.textContent = 'Played Today';
            badge.hidden = false;
        }
    }

    function initPortal() {
        var path = window.location.pathname || '';
        var isPlayDashboard = path === '/play/' || path === '/play' || path === '/play/index.html';
        var isPlayGameRoute = path.indexOf('/play/') === 0 && !isPlayDashboard;

        if (isPlayGameRoute) {
            trackGameLaunch();
        }

        if (isPlayDashboard) {
            updatePlayedTodayBadges();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPortal, { once: true });
    } else {
        initPortal();
    }

    window.pcPortal = {
        getGameActivity: getGameActivity,
        saveGameActivity: saveGameActivity,
        updatePlayedTodayBadges: updatePlayedTodayBadges
    };
})();
