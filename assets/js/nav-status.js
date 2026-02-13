(function () {
    var AUTH_STATE_KEY = 'pc_sync_auth_state';
    var TEXT_SCALE_KEY = 'pc_text_scale_v1';
    var DESKTOP_VIEW_KEY = 'pc_desktop_view_v1';
    var DEFAULT_FONT_SIZE = 16;
    var DEFAULT_TEXT_SCALE = 1;
    var MIN_TEXT_SCALE = 0.85;
    var MAX_TEXT_SCALE = 1.35;
    var TEXT_SCALE_STEP = 0.1;
    var DESKTOP_WIDTH = 1280;
    var desktopViewDefaultViewport = '';
    var NAV_ITEMS = [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'clinical-tools', label: 'Clinical Tools', href: '/tools/' },
        {
            id: 'study',
            label: 'Study',
            href: '/study/',
            children: [
                { label: 'NAVLE Practice', href: '/study/navle/practice/' },
                { label: 'Reference', href: '/reference/' },
                { label: 'NAVLE Topics', href: '/study/wordweb/' },
                { label: 'Topic Guides', href: '/study/navle/topics/' },
                { label: "Today's Plan", href: '/today/' },
                { label: 'Case Directory', href: '/bridge/case-studies/' }
            ]
        },
        {
            id: 'play',
            label: 'Play',
            href: '/play/',
            children: [
                { label: 'Sudoku', href: '/play/sudoku/' },
                { label: 'Memory Match', href: '/play/memory-match/' },
                { label: '2048', href: '/play/2048/' },
                { label: 'Tic-Tac-Toe', href: '/play/tictactoe/' },
                { label: 'IQ Challenge', href: '/play/iq-challenge/' }
            ]
        },
        {
            id: 'profile',
            label: 'Profile',
            href: '/account/',
            children: [
                { label: 'Account & Sync', href: '/account/' },
                { label: 'About Me', href: '/info.html' }
            ]
        },
        { id: 'search', label: 'Search', href: '/search.html' }
    ];

    function isLoggedInFromCache() {
        try {
            return localStorage.getItem(AUTH_STATE_KEY) === 'signed_in';
        } catch (error) {
            return false;
        }
    }

    function applyIndicator(loggedIn) {
        var indicators = document.querySelectorAll('[data-pc-auth-indicator]');
        for (var i = 0; i < indicators.length; i += 1) {
            var indicator = indicators[i];
            indicator.textContent = loggedIn ? '●' : '○';
            indicator.classList.toggle('pc-auth-indicator--on', loggedIn);
            indicator.classList.toggle('pc-auth-indicator--off', !loggedIn);
            indicator.setAttribute('title', loggedIn ? 'Logged in' : 'Anonymous mode');
        }
    }

    function normalizePath(pathname) {
        var path = String(pathname || '/');
        if (!path) {
            return '/';
        }

        if (path === '/index.html') {
            return '/';
        }

        if (path.length > 1 && path.charAt(path.length - 1) === '/') {
            path = path.slice(0, -1);
        }

        return path || '/';
    }

    function isPathMatch(pathname, href) {
        var current = normalizePath(pathname);
        var target = normalizePath(href);

        if (target === '/') {
            return current === '/';
        }

        if (target.indexOf('.html') !== -1) {
            return current === target;
        }

        return current === target || current.indexOf(target + '/') === 0;
    }

    function getActiveNavId(pathname) {
        var path = normalizePath(pathname);

        if (path === '/') {
            return 'home';
        }

        if (path === '/tools' || path.indexOf('/tools/') === 0) {
            return 'clinical-tools';
        }

        if (
            path === '/study' ||
            path.indexOf('/study/') === 0 ||
            path === '/reference' ||
            path.indexOf('/reference/') === 0 ||
            path === '/today' ||
            path.indexOf('/today/') === 0 ||
            path === '/bridge' ||
            path.indexOf('/bridge/') === 0
        ) {
            return 'study';
        }

        if (path === '/play' || path.indexOf('/play/') === 0 || path === '/leaderboard' || path.indexOf('/leaderboard/') === 0) {
            return 'play';
        }

        if (path === '/search' || path === '/search.html') {
            return 'search';
        }

        if (path === '/account' || path.indexOf('/account/') === 0 || path === '/info' || path === '/info.html') {
            return 'profile';
        }

        return 'home';
    }

    function createPortalNavItem(item, activeId, pathname) {
        var wrapper = document.createElement('div');
        wrapper.className = 'pc-nav-item';

        if (item.children && item.children.length) {
            wrapper.className += ' pc-nav-item--has-menu';
        }

        var anchor = document.createElement('a');
        anchor.className = 'pc-nav-link' + (item.id === activeId ? ' pc-is-active' : '');
        anchor.href = item.href;

        if (item.id === 'profile') {
            var indicator = document.createElement('span');
            indicator.className = 'pc-auth-indicator';
            indicator.setAttribute('data-pc-auth-indicator', '');
            indicator.setAttribute('aria-hidden', 'true');
            indicator.textContent = '○';
            anchor.appendChild(indicator);
        }

        anchor.appendChild(document.createTextNode(item.label));
        wrapper.appendChild(anchor);

        if (item.children && item.children.length) {
            var submenu = document.createElement('div');
            submenu.className = 'pc-nav-submenu';
            submenu.setAttribute('role', 'menu');
            submenu.setAttribute('aria-label', item.label + ' links');

            for (var i = 0; i < item.children.length; i += 1) {
                var child = item.children[i];
                var childLink = document.createElement('a');
                childLink.className = 'pc-nav-submenu__link';
                if (isPathMatch(pathname, child.href)) {
                    childLink.className += ' pc-nav-submenu__link--active';
                }
                childLink.href = child.href;
                childLink.textContent = child.label;
                childLink.setAttribute('role', 'menuitem');
                submenu.appendChild(childLink);
            }

            wrapper.appendChild(submenu);
        }

        return wrapper;
    }

    function createLegacyNavLink(item, activeId) {
        var anchor = document.createElement('a');
        anchor.className = 'pc-nav__link' + (item.id === activeId ? ' pc-nav__link--active' : '');
        anchor.href = item.href;
        anchor.textContent = item.label;
        return anchor;
    }

    function normalizePortalNav() {
        var groups = document.querySelectorAll('.pc-portal-nav .pc-nav-group');
        if (!groups.length) {
            return;
        }

        var pathname = window.location.pathname || '/';
        var activeId = getActiveNavId(pathname);

        for (var i = 0; i < groups.length; i += 1) {
            var group = groups[i];
            var modeToggle = group.querySelector('[data-pc-mode-toggle]');
            var themeToggle = group.querySelector('[data-pc-theme-toggle]');
            var insertBefore = modeToggle || themeToggle || null;

            var existingItems = group.querySelectorAll('.pc-nav-link, .pc-nav-item');
            for (var j = 0; j < existingItems.length; j += 1) {
                existingItems[j].remove();
            }

            for (var k = 0; k < NAV_ITEMS.length; k += 1) {
                var navItem = createPortalNavItem(NAV_ITEMS[k], activeId, pathname);
                if (insertBefore) {
                    group.insertBefore(navItem, insertBefore);
                } else {
                    group.appendChild(navItem);
                }
            }
        }
    }

    function normalizeLegacyNav() {
        var legacyGroups = document.querySelectorAll('.pc-nav .pc-nav__links');
        if (!legacyGroups.length) {
            return;
        }

        var pathname = window.location.pathname || '/';
        var activeId = getActiveNavId(pathname);

        for (var i = 0; i < legacyGroups.length; i += 1) {
            var group = legacyGroups[i];
            group.innerHTML = '';
            for (var j = 0; j < NAV_ITEMS.length; j += 1) {
                group.appendChild(createLegacyNavLink(NAV_ITEMS[j], activeId));
            }
        }
    }

    function appendGlobalQuickLinksIfMissing() {
        if (document.querySelector('[data-pc-global-quick-links]')) {
            return;
        }

        if (document.querySelector('.pc-link-strip') || document.querySelector('.pc-footer-links')) {
            return;
        }

        var main = document.querySelector('main');
        if (!main) {
            return;
        }

        var strip = document.createElement('div');
        strip.className = 'pc-link-strip';
        strip.setAttribute('data-pc-global-quick-links', 'true');
        strip.setAttribute('aria-label', 'Quick references');

        var quickLinks = [
            { label: 'Clinical Tools', href: '/tools/' },
            { label: 'NAVLE Practice', href: '/study/navle/practice/' },
            { label: 'Reference', href: '/reference/' },
            { label: 'NAVLE Topics', href: '/study/wordweb/' },
            { label: 'Topic Guides', href: '/study/navle/topics/' },
            { label: 'Play', href: '/play/' }
        ];

        for (var i = 0; i < quickLinks.length; i += 1) {
            var link = document.createElement('a');
            link.className = 'pc-link-chip';
            link.href = quickLinks[i].href;
            link.textContent = quickLinks[i].label;
            strip.appendChild(link);
        }

        main.appendChild(strip);
    }

    function recordLastLearningLocation() {
        var path = window.location.pathname || '/';
        var isLearningPath = path.indexOf('/study/') === 0 ||
            path.indexOf('/bridge/') === 0 ||
            path.indexOf('/tools/') === 0;

        if (!isLearningPath) {
            return;
        }

        try {
            localStorage.setItem('pc_last_learning_url_v1', path + (window.location.search || ''));
            localStorage.setItem('pc_last_learning_seen_at_v1', new Date().toISOString());
        } catch (error) {
            // Best effort persistence.
        }
    }

    function clamp(value, min, max) {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }

    function toScale(value) {
        var parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return DEFAULT_TEXT_SCALE;
        }
        return clamp(parsed, MIN_TEXT_SCALE, MAX_TEXT_SCALE);
    }

    function readStoredTextScale() {
        try {
            return toScale(localStorage.getItem(TEXT_SCALE_KEY));
        } catch (error) {
            return DEFAULT_TEXT_SCALE;
        }
    }

    function writeStoredTextScale(scale) {
        try {
            localStorage.setItem(TEXT_SCALE_KEY, String(scale));
        } catch (error) {
            // Best effort persistence.
        }
    }

    function readDesktopViewPreference() {
        try {
            return localStorage.getItem(DESKTOP_VIEW_KEY) === 'true';
        } catch (error) {
            return false;
        }
    }

    function writeDesktopViewPreference(enabled) {
        try {
            localStorage.setItem(DESKTOP_VIEW_KEY, enabled ? 'true' : 'false');
        } catch (error) {
            // Best effort persistence.
        }
    }

    function ensureViewportMeta() {
        var viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            return viewport;
        }

        var created = document.createElement('meta');
        created.setAttribute('name', 'viewport');
        created.setAttribute('content', 'width=device-width, initial-scale=1.0');
        document.head.appendChild(created);
        return created;
    }

    function setDesktopViewport() {
        var viewport = ensureViewportMeta();
        if (!viewport) {
            return;
        }

        if (!desktopViewDefaultViewport) {
            desktopViewDefaultViewport = viewport.getAttribute('content') || 'width=device-width, initial-scale=1.0';
        }

        var width = window.innerWidth || (window.screen && window.screen.width) || 390;
        var initialScale = clamp(width / DESKTOP_WIDTH, 0.22, 1);
        viewport.setAttribute(
            'content',
            'width=' + DESKTOP_WIDTH + ', initial-scale=' + initialScale.toFixed(2) + ', minimum-scale=0.2, maximum-scale=5, user-scalable=yes'
        );
        document.documentElement.classList.add('pc-force-desktop-view');
    }

    function clearDesktopViewport() {
        var viewport = ensureViewportMeta();
        if (!viewport) {
            return;
        }

        var fallback = desktopViewDefaultViewport || 'width=device-width, initial-scale=1.0';
        viewport.setAttribute('content', fallback);
        document.documentElement.classList.remove('pc-force-desktop-view');
    }

    function applyDesktopView(enabled) {
        if (enabled) {
            setDesktopViewport();
        } else {
            clearDesktopViewport();
        }
        writeDesktopViewPreference(!!enabled);
    }

    function applyTextScale(scale) {
        var normalized = toScale(scale);
        document.documentElement.style.fontSize = (DEFAULT_FONT_SIZE * normalized).toFixed(2) + 'px';
        document.documentElement.setAttribute('data-pc-text-scale', normalized.toFixed(2));
        writeStoredTextScale(normalized);
    }

    function updateTextScaleLabel(scale) {
        var label = document.getElementById('pc-view-text-scale-value');
        if (!label) {
            return;
        }
        label.textContent = Math.round(scale * 100) + '%';
    }

    function updateDesktopLabel(enabled) {
        var label = document.getElementById('pc-view-desktop-label');
        if (!label) {
            return;
        }
        label.textContent = enabled ? 'Desktop view: On' : 'Desktop view: Off';
    }

    function toggleViewPanel(forceOpen) {
        var panel = document.getElementById('pc-view-panel');
        var trigger = document.getElementById('pc-view-trigger');
        if (!panel || !trigger) {
            return;
        }

        var shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.hidden;
        panel.hidden = !shouldOpen;
        trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    }

    function injectViewControls() {
        if (document.getElementById('pc-view-controls')) {
            return;
        }

        var wrapper = document.createElement('div');
        wrapper.id = 'pc-view-controls';
        wrapper.className = 'pc-view-controls';

        var trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.id = 'pc-view-trigger';
        trigger.className = 'pc-view-trigger';
        trigger.setAttribute('aria-label', 'Open text and view controls');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.textContent = 'Aa';

        var panel = document.createElement('div');
        panel.id = 'pc-view-panel';
        panel.className = 'pc-view-panel';
        panel.hidden = true;
        panel.innerHTML =
            '<p class="pc-view-panel__title">Text & View</p>' +
            '<div class="pc-view-scale-row" role="group" aria-label="Text size controls">' +
            '<button type="button" class="pc-view-mini-btn" id="pc-view-text-down" aria-label="Decrease text size">A-</button>' +
            '<span id="pc-view-text-scale-value" class="pc-view-scale-value">100%</span>' +
            '<button type="button" class="pc-view-mini-btn" id="pc-view-text-up" aria-label="Increase text size">A+</button>' +
            '<button type="button" class="pc-view-mini-btn" id="pc-view-text-reset" aria-label="Reset text size">Reset</button>' +
            '</div>' +
            '<button type="button" class="pc-view-desktop-toggle" id="pc-view-desktop-toggle">' +
            '<span id="pc-view-desktop-label">Desktop view: Off</span>' +
            '</button>';

        wrapper.appendChild(trigger);
        wrapper.appendChild(panel);
        document.body.appendChild(wrapper);

        trigger.addEventListener('click', function () {
            toggleViewPanel();
        });

        document.getElementById('pc-view-text-down').addEventListener('click', function () {
            var currentScale = toScale(readStoredTextScale());
            var nextScale = clamp(currentScale - TEXT_SCALE_STEP, MIN_TEXT_SCALE, MAX_TEXT_SCALE);
            applyTextScale(nextScale);
            updateTextScaleLabel(nextScale);
        });

        document.getElementById('pc-view-text-up').addEventListener('click', function () {
            var currentScale = toScale(readStoredTextScale());
            var nextScale = clamp(currentScale + TEXT_SCALE_STEP, MIN_TEXT_SCALE, MAX_TEXT_SCALE);
            applyTextScale(nextScale);
            updateTextScaleLabel(nextScale);
        });

        document.getElementById('pc-view-text-reset').addEventListener('click', function () {
            applyTextScale(DEFAULT_TEXT_SCALE);
            updateTextScaleLabel(DEFAULT_TEXT_SCALE);
        });

        document.getElementById('pc-view-desktop-toggle').addEventListener('click', function () {
            var enabled = !readDesktopViewPreference();
            applyDesktopView(enabled);
            updateDesktopLabel(enabled);
        });

        document.addEventListener('click', function (event) {
            if (!wrapper.contains(event.target)) {
                toggleViewPanel(false);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                toggleViewPanel(false);
            }
        });

        var initialScale = readStoredTextScale();
        applyTextScale(initialScale);
        updateTextScaleLabel(initialScale);

        var desktopEnabled = readDesktopViewPreference();
        applyDesktopView(desktopEnabled);
        updateDesktopLabel(desktopEnabled);

        window.addEventListener('resize', function () {
            if (readDesktopViewPreference()) {
                setDesktopViewport();
            }
        });
    }

    function initUserViewControls() {
        var scale = readStoredTextScale();
        applyTextScale(scale);
        injectViewControls();
    }

    function init() {
        normalizePortalNav();
        normalizeLegacyNav();
        appendGlobalQuickLinksIfMissing();
        recordLastLearningLocation();
        initUserViewControls();

        applyIndicator(isLoggedInFromCache());

        window.addEventListener('storage', function (event) {
            if (event.key === AUTH_STATE_KEY) {
                applyIndicator(event.newValue === 'signed_in');
            }
        });

        window.addEventListener('pc-auth-status-change', function (event) {
            var loggedIn = !!(event && event.detail && event.detail.loggedIn);
            applyIndicator(loggedIn);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
