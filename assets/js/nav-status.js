(function () {
    var AUTH_STATE_KEY = 'pc_sync_auth_state';
    var NAV_ITEMS = [
        { id: 'home', label: 'Home', href: '/' },
        {
            id: 'study',
            label: 'Study',
            href: '/study/',
            children: [
                { label: 'Clinical Tools', href: '/tools/' },
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

        if (
            path === '/study' ||
            path.indexOf('/study/') === 0 ||
            path === '/tools' ||
            path.indexOf('/tools/') === 0 ||
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

    function init() {
        normalizePortalNav();
        normalizeLegacyNav();
        appendGlobalQuickLinksIfMissing();

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
