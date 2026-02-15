;(function () {
  var SITE_BRAND = 'VetLudics'
  var AUTH_STATE_KEY = 'pc_sync_auth_state'
  var TEXT_SCALE_KEY = 'pc_text_scale_v1'
  var DESKTOP_VIEW_KEY = 'pc_desktop_view_v1'
  var DEFAULT_FONT_SIZE = 16
  var DEFAULT_TEXT_SCALE = 1
  var MIN_TEXT_SCALE = 0.85
  var MAX_TEXT_SCALE = 1.35
  var TEXT_SCALE_STEP = 0.1
  var DESKTOP_WIDTH = 1280
  var desktopViewDefaultViewport = ''
  var ANALYTICS_SESSION_KEY = 'pc_analytics_session_v1'
  var ANALYTICS_VISITOR_KEY = 'pc_analytics_visitor_v1'
  var LAST_VISIT_KEY = 'pc_last_visit_iso_v1'
  var RETENTION_7D_EMIT_KEY = 'pc_retention_7d_emit_day_v1'
  var RETENTION_30D_EMIT_KEY = 'pc_retention_30d_emit_day_v1'
  var ANALYTICS_BUFFER_KEY = 'pc_analytics_buffer_v1'
  var ANALYTICS_BUFFER_LIMIT = 80
  var analyticsInitialized = false
  var SERVICE_WORKER_URL = '/service-worker.js'
  var NAV_ITEMS = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'pricing', label: 'Pricing', href: '/pricing/' },
    { id: 'account', label: 'Account', href: '/account/' },
    {
      id: 'about',
      label: 'About',
      href: '/about.html',
      children: [
        { label: 'Editorial Policy', href: '/editorial-policy/' },
        { label: 'Contact', href: '/contact.html' },
      ],
    },
  ]
  var PLAY_ICON = '\u25b6'

  var TOOL_LANDING_PATHS = [
    '/veterinary-calculators-guide',
    '/mgkg-dosing-guide',
    '/cri-setup-guide',
    '/fluid-deficit-guide',
    '/maintenance-fluids-guide',
    '/anion-gap-interpretation',
    '/osmolality-basics-veterinary',
    '/dextrose-correction-guide',
    '/body-condition-score-guide',
    '/toxic-dose-calculations-guide',
    '/lab-interpretation-caveats',
  ]

  var STUDY_LANDING_PATHS = [
    '/navle-emergency-critical-care',
    '/gdv-approach',
    '/shock-types-veterinary',
    '/sepsis-sirs-veterinary',
    '/dka-approach-veterinary',
    '/heatstroke-veterinary',
    '/transfusion-basics-veterinary',
    '/rodenticide-bleeding-veterinary',
    '/pleural-effusion-differentials-veterinary',
    '/canine-feline-chf',
    '/chf-staging-overview',
    '/murmur-approach-dog-cat',
    '/ecg-rhythm-id-af-svt-vt',
    '/systemic-hypertension-target-organ-damage',
    '/dcm-basics-dog-cat',
    '/pleural-effusion-vs-pulmonary-edema',
    '/pimobendan-diuretics-overview',
    '/syncope-differentials-dog-cat',
  ]

  function startsWithAny(path, prefixes) {
    for (var i = 0; i < prefixes.length; i += 1) {
      if (path === prefixes[i] || path.indexOf(prefixes[i] + '/') === 0) {
        return true
      }
    }
    return false
  }

  function scheduleNonCritical(fn, timeoutMs) {
    var wait = typeof timeoutMs === 'number' ? timeoutMs : 150
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(
        function () {
          fn()
        },
        { timeout: wait }
      )
      return
    }
    window.setTimeout(fn, wait)
  }

  function loadScriptAsync(src) {
    if (!src || document.querySelector('script[src="' + src + '"]')) {
      return
    }
    var script = document.createElement('script')
    script.src = src
    script.defer = true
    document.head.appendChild(script)
  }

  function isLoggedInFromCache() {
    try {
      return localStorage.getItem(AUTH_STATE_KEY) === 'signed_in'
    } catch (error) {
      return false
    }
  }

  function applyIndicator(loggedIn) {
    var indicators = document.querySelectorAll('[data-pc-auth-indicator]')
    for (var i = 0; i < indicators.length; i += 1) {
      var indicator = indicators[i]
      indicator.textContent = loggedIn ? '●' : '○'
      indicator.classList.toggle('pc-auth-indicator--on', loggedIn)
      indicator.classList.toggle('pc-auth-indicator--off', !loggedIn)
      indicator.setAttribute('title', loggedIn ? 'Logged in' : 'Anonymous mode')
    }
  }

  function normalizePath(pathname) {
    var path = String(pathname || '/')
    if (!path) {
      return '/'
    }

    if (path === '/index.html') {
      return '/'
    }

    if (path.length > 1 && path.charAt(path.length - 1) === '/') {
      path = path.slice(0, -1)
    }

    return path || '/'
  }

  function isPathMatch(pathname, href) {
    var current = normalizePath(pathname)
    var target = normalizePath(href)

    if (target === '/') {
      return current === '/'
    }

    if (target.indexOf('.html') !== -1) {
      return current === target
    }

    return current === target || current.indexOf(target + '/') === 0
  }

  function getActiveNavId(pathname) {
    var path = normalizePath(pathname)

    if (path === '/') {
      return 'home'
    }

    if (path === '/pricing' || path.indexOf('/pricing/') === 0) {
      return 'pricing'
    }

    if (path === '/account' || path.indexOf('/account/') === 0) {
      return 'account'
    }

    if (
      path === '/about' ||
      path.indexOf('/about/') === 0 ||
      path === '/about.html' ||
      path === '/info' ||
      path === '/info.html' ||
      path === '/contact' ||
      path === '/contact.html' ||
      path === '/editorial-policy' ||
      path.indexOf('/editorial-policy/') === 0
    ) {
      return 'about'
    }

    return ''
  }

  function createPortalNavItem(item, activeId, pathname, depth) {
    var navDepth = typeof depth === 'number' ? depth : 0
    var wrapper = document.createElement('div')
    wrapper.className = 'pc-nav-item pc-nav-item--depth-' + navDepth
    var hasChildren = item.children && item.children.length

    if (hasChildren) {
      wrapper.className += ' pc-nav-item--has-menu'
    }

    var anchor = document.createElement('a')
    if (navDepth === 0) {
      anchor.className =
        'pc-nav-link' + (item.id === activeId ? ' pc-is-active' : '')
    } else {
      anchor.className = 'pc-nav-submenu__link'
      if (isPathMatch(pathname, item.href)) {
        anchor.className += ' pc-nav-submenu__link--active'
      }
      anchor.setAttribute('role', 'menuitem')
    }
    if (hasChildren) {
      anchor.className += ' pc-nav-menu-trigger'
      if (navDepth > 0) {
        anchor.className += ' pc-nav-submenu__trigger'
      }
    }
    anchor.href = item.href

    anchor.appendChild(document.createTextNode(item.label))
    wrapper.appendChild(anchor)

    if (hasChildren) {
      var submenu = document.createElement('div')
      submenu.className =
        'pc-nav-submenu' + (navDepth > 0 ? ' pc-nav-submenu--nested' : '')
      submenu.setAttribute('role', 'menu')
      submenu.setAttribute('aria-label', item.label + ' links')

      for (var i = 0; i < item.children.length; i += 1) {
        submenu.appendChild(
          createPortalNavItem(
            item.children[i],
            activeId,
            pathname,
            navDepth + 1
          )
        )
      }

      wrapper.appendChild(submenu)
    }

    return wrapper
  }

  function getDirectChildByClass(node, className) {
    if (!node || !node.children) {
      return null
    }
    for (var i = 0; i < node.children.length; i += 1) {
      var child = node.children[i]
      if (child.classList && child.classList.contains(className)) {
        return child
      }
    }
    return null
  }

  function createLegacyNavLink(item, activeId) {
    var anchor = document.createElement('a')
    anchor.className =
      'pc-nav__link' + (item.id === activeId ? ' pc-nav__link--active' : '')
    anchor.href = item.href
    anchor.textContent = item.label
    return anchor
  }

  function createPlayNavAction(pathname) {
    var anchor = document.createElement('a')
    var isActive = isPathMatch(pathname, '/play/')
    anchor.className =
      'pc-nav-action pc-nav-action--play' + (isActive ? ' pc-is-active' : '')
    anchor.href = '/play/'
    anchor.setAttribute('title', 'Open games')
    anchor.setAttribute('aria-label', 'Open games')
    anchor.innerHTML =
      '<span class="pc-nav-action__icon" aria-hidden="true">' +
      PLAY_ICON +
      '</span>' +
      '<span class="pc-nav-action__label">Play</span>'
    return anchor
  }

  function normalizePortalNav() {
    var groups = document.querySelectorAll('.pc-portal-nav .pc-nav-group')
    if (!groups.length) {
      return
    }

    var pathname = window.location.pathname || '/'
    var activeId = getActiveNavId(pathname)

    for (var i = 0; i < groups.length; i += 1) {
      var group = groups[i]
      var modeToggle = group.querySelector('[data-pc-mode-toggle]')
      var themeToggle = group.querySelector('[data-pc-theme-toggle]')
      var insertBefore = modeToggle || themeToggle || null

      var existingItems = group.querySelectorAll(
        '.pc-nav-link, .pc-nav-item, .pc-nav-action'
      )
      for (var j = 0; j < existingItems.length; j += 1) {
        existingItems[j].remove()
      }

      for (var k = 0; k < NAV_ITEMS.length; k += 1) {
        var navItem = createPortalNavItem(NAV_ITEMS[k], activeId, pathname, 0)
        if (insertBefore) {
          group.insertBefore(navItem, insertBefore)
        } else {
          group.appendChild(navItem)
        }
      }

      var playAction = createPlayNavAction(pathname)
      if (insertBefore) {
        group.insertBefore(playAction, insertBefore)
      } else {
        group.appendChild(playAction)
      }
    }
  }

  function bindPortalMenuKeyboardSupport() {
    var menuItems = document.querySelectorAll('.pc-nav-item--has-menu')
    for (var i = 0; i < menuItems.length; i += 1) {
      ;(function (item) {
        var trigger = getDirectChildByClass(item, 'pc-nav-menu-trigger')
        var submenu = getDirectChildByClass(item, 'pc-nav-submenu')
        if (!trigger || !submenu) {
          return
        }

        trigger.setAttribute('aria-haspopup', 'true')
        trigger.setAttribute('aria-expanded', 'false')

        item.addEventListener('focusin', function () {
          trigger.setAttribute('aria-expanded', 'true')
        })

        item.addEventListener('focusout', function (event) {
          if (item.contains(event.relatedTarget)) {
            return
          }
          trigger.setAttribute('aria-expanded', 'false')
        })

        trigger.addEventListener('keydown', function (event) {
          if (event.key === 'ArrowDown') {
            var firstLink = submenu.querySelector(
              '.pc-nav-submenu__link, .pc-nav-link'
            )
            if (firstLink) {
              event.preventDefault()
              firstLink.focus()
              trigger.setAttribute('aria-expanded', 'true')
            }
          }

          if (event.key === 'Escape') {
            trigger.setAttribute('aria-expanded', 'false')
            trigger.blur()
          }
        })

        submenu.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            event.preventDefault()
            trigger.setAttribute('aria-expanded', 'false')
            trigger.focus()
          }
        })
      })(menuItems[i])
    }
  }

  function normalizeLegacyNav() {
    var legacyGroups = document.querySelectorAll('.pc-nav .pc-nav__links')
    if (!legacyGroups.length) {
      return
    }

    var pathname = window.location.pathname || '/'
    var activeId = getActiveNavId(pathname)

    for (var i = 0; i < legacyGroups.length; i += 1) {
      var group = legacyGroups[i]
      group.innerHTML = ''
      for (var j = 0; j < NAV_ITEMS.length; j += 1) {
        group.appendChild(createLegacyNavLink(NAV_ITEMS[j], activeId))
      }
    }
  }

  function applyBrandLabel() {
    var logos = document.querySelectorAll('.pc-logo')
    for (var i = 0; i < logos.length; i += 1) {
      logos[i].textContent = SITE_BRAND
      logos[i].setAttribute('aria-label', SITE_BRAND + ' home')
      logos[i].setAttribute('title', SITE_BRAND)
    }
  }

  function initGlobalMotionSync() {
    if (!document.body) {
      return
    }

    var reduceMotion = false
    try {
      reduceMotion =
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch (error) {
      reduceMotion = false
    }

    if (reduceMotion) {
      document.body.classList.add('pc-motion-disabled')
      return
    }

    document.body.classList.add('pc-motion-ready')

    function addVariant(selector, variantClass) {
      var nodes = document.querySelectorAll(selector)
      for (var index = 0; index < nodes.length; index += 1) {
        nodes[index].classList.add(variantClass)
      }
    }

    addVariant(
      '.pc-bridge-hero, .pc-bridge-title, .pc-fork-title, .pc-kicker',
      'pc-motion-item--hero'
    )
    addVariant(
      '.pc-fork-copy, .pc-panel-actions, .pc-link-list, .pc-last-reviewed, .pc-disclaimer, .pc-findings, .pc-table',
      'pc-motion-item--soft'
    )
    addVariant(
      '.pc-home-tier-card, .pc-bridge-card, .pc-tool-module, .pc-topic-card, .pc-study-panel, .pc-search-panel, ' +
        '.pc-navle-clean-card, .pc-pricing-card, .pc-account-card, .pc-case-article, .pc-stat-card, .pc-note-box, ' +
        '.pc-competency-card, .pc-game-card, .pc-experience-card, .pc-faq-item, .pc-navle-priority-row',
      'pc-motion-item--float'
    )

    var targets = document.querySelectorAll(
      '.pc-bridge-hero, .pc-bridge-section, .pc-home-tier-card, .pc-bridge-card, ' +
        '.pc-tool-module, .pc-topic-card, .pc-study-panel, .pc-search-panel, ' +
        '.pc-navle-clean-card, .pc-pricing-card, .pc-account-card, .pc-case-article, ' +
        '.pc-stat-card, .pc-table-wrap, .pc-note-box, .pc-competency-card, ' +
        '.pc-kicker, .pc-bridge-title, .pc-fork-title, .pc-fork-copy, .pc-panel-actions, ' +
        '.pc-link-list, .pc-cta-banner, .pc-findings, .pc-table, .pc-last-reviewed, ' +
        '.pc-disclaimer, .pc-game-card, .pc-experience-card, .pc-navle-priority-row, .pc-faq-item'
    )

    if (!targets.length) {
      return
    }

    var items = []
    for (var i = 0; i < targets.length; i += 1) {
      var element = targets[i]
      element.classList.add('pc-motion-item')
      element.style.setProperty('--pc-motion-delay', (i % 10) * 52 + 'ms')

      if (element.classList.contains('pc-motion-item--float')) {
        element.style.setProperty('--pc-float-delay', (i % 6) * 350 + 'ms')
        element.style.setProperty('--pc-float-amplitude', (i % 3) + 2 + 'px')
      }
      items.push(element)
    }

    if (!('IntersectionObserver' in window)) {
      for (var j = 0; j < items.length; j += 1) {
        items[j].classList.add('pc-is-visible')
      }
      return
    }

    var observer = new IntersectionObserver(
      function (entries) {
        for (var entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
          var entry = entries[entryIndex]
          if (!entry.isIntersecting) {
            continue
          }
          entry.target.classList.add('pc-is-visible')
          observer.unobserve(entry.target)
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -9% 0px',
        threshold: 0.12,
      }
    )

    for (var k = 0; k < items.length; k += 1) {
      observer.observe(items[k])
    }
  }

  function ensureSkipLink() {
    if (document.querySelector('.pc-skip-link')) {
      return
    }

    var main = document.querySelector('main')
    if (!main) {
      return
    }

    if (!main.id) {
      main.id = 'pc-main'
    }

    var link = document.createElement('a')
    link.className = 'pc-skip-link'
    link.href = '#' + main.id
    link.textContent = 'Skip to main content'

    var body = document.body
    if (!body) {
      return
    }
    body.insertBefore(link, body.firstChild)
  }

  function ensureCanonicalLink() {
    var canonical = document.querySelector('link[rel=\"canonical\"]')
    var path = window.location.pathname || '/'
    var cleanPath = path === '/index.html' ? '/' : path
    var fallbackHref = toAbsoluteUrl(cleanPath)

    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      canonical.setAttribute('href', fallbackHref)
      document.head.appendChild(canonical)
      return
    }

    var currentHref = canonical.getAttribute('href') || fallbackHref
    canonical.setAttribute('href', currentHref.split('#')[0].split('?')[0])
  }

  function appendGlobalQuickLinksIfMissing() {
    if (document.querySelector('[data-pc-global-quick-links]')) {
      return
    }

    if (
      document.querySelector('.pc-link-strip') ||
      document.querySelector('.pc-footer-links')
    ) {
      return
    }

    var main = document.querySelector('main')
    if (!main) {
      return
    }

    var strip = document.createElement('div')
    strip.className = 'pc-link-strip'
    strip.setAttribute('data-pc-global-quick-links', 'true')
    strip.setAttribute('aria-label', 'Quick references')

    var quickLinks = [
      { label: 'Tools & References', href: '/tools/' },
      { label: 'NAVLE Hub', href: '/study/navle/' },
      { label: 'Pricing', href: '/pricing/' },
      { label: 'About', href: '/about.html' },
    ]

    for (var i = 0; i < quickLinks.length; i += 1) {
      var link = document.createElement('a')
      link.className = 'pc-link-chip'
      link.href = quickLinks[i].href
      link.textContent = quickLinks[i].label
      strip.appendChild(link)
    }

    main.appendChild(strip)
  }

  function shouldSkipGlobalFooter(path) {
    return (
      path.indexOf('/leaderboard') === 0 ||
      path.indexOf('/app') === 0 ||
      path.indexOf('/archive') === 0 ||
      (document.body && document.body.classList.contains('pc-page--gameframe'))
    )
  }

  function appendGlobalFooterIfMissing() {
    if (
      document.querySelector('.pc-footer') ||
      document.querySelector('[data-pc-global-footer]')
    ) {
      return
    }

    var main = document.querySelector('main')
    if (!main) {
      return
    }

    var path = normalizePath(window.location.pathname || '/')
    if (shouldSkipGlobalFooter(path)) {
      return
    }

    var footer = document.createElement('footer')
    footer.className = 'pc-footer pc-footer--global'
    footer.setAttribute('data-pc-global-footer', 'true')
    footer.innerHTML =
      '<div class="pc-footer-links">' +
      '<a href="/about.html">About & Credentials</a>' +
      '<a href="/terms/">Terms of Service</a>' +
      '<a href="/privacy/">Privacy Policy</a>' +
      '<a href="/licenses/">Legal & Licenses</a>' +
      '<a href="/accessibility-plan/">Accessibility Plan</a>' +
      '<a href="/contact.html">Contact</a>' +
      '</div>' +
      '<p class="pc-footer-note"><strong>Status:</strong> NAVLE candidate and veterinary assistant/technician. Not licensed to practice veterinary medicine in North America.</p>' +
      '<p class="pc-footer-note">Educational use only. ' +
      SITE_BRAND +
      ' content is for exam preparation and does not create a veterinary-client-patient relationship (VCPR).</p>' +
      '<p class="pc-footer-note">NAVLE&reg; is a registered trademark of ICVA. Not affiliated with NAVLE, ICVA, or any veterinary licensing board.</p>'

    main.appendChild(footer)
  }

  function isAnalyticsConsentGranted() {
    if (
      window.pcLegal &&
      typeof window.pcLegal.canUseAnalytics === 'function'
    ) {
      return !!window.pcLegal.canUseAnalytics()
    }
    return false
  }

  function initAnalyticsIfAllowed() {
    if (analyticsInitialized) {
      return
    }
    if (!isAnalyticsConsentGranted()) {
      return
    }
    analyticsInitialized = true
    initAnalytics()
  }

  function getBreadcrumbRoot(path) {
    if (
      path === '/tools' ||
      path.indexOf('/tools/') === 0 ||
      path === '/veterinary-calculators' ||
      path.indexOf('/veterinary-calculators/') === 0 ||
      path === '/emergency-triage-algorithms' ||
      path.indexOf('/emergency-triage-algorithms/') === 0 ||
      path === '/sources-and-limitations' ||
      path.indexOf('/sources-and-limitations/') === 0 ||
      startsWithAny(path, TOOL_LANDING_PATHS)
    ) {
      return { label: 'Tools & References', href: '/tools/' }
    }

    if (
      path === '/study' ||
      path.indexOf('/study/') === 0 ||
      path === '/bridge' ||
      path.indexOf('/bridge/') === 0 ||
      path === '/cardiology-chf-algorithm' ||
      path.indexOf('/cardiology-chf-algorithm/') === 0 ||
      startsWithAny(path, STUDY_LANDING_PATHS)
    ) {
      return { label: 'NAVLE Hub', href: '/study/navle/' }
    }

    if (
      path === '/reference' ||
      path.indexOf('/reference/') === 0 ||
      path === '/dog-cat-normal-values' ||
      path.indexOf('/dog-cat-normal-values/') === 0
    ) {
      return { label: 'Tools & References', href: '/tools/' }
    }

    if (
      path === '/about' ||
      path.indexOf('/about/') === 0 ||
      path === '/about.html' ||
      path === '/info' ||
      path === '/info.html' ||
      path === '/contact' ||
      path === '/contact.html' ||
      path === '/editorial-policy' ||
      path.indexOf('/editorial-policy/') === 0
    ) {
      return { label: 'About', href: '/about.html' }
    }

    return null
  }

  function getCurrentPageLabel() {
    var heading = document.querySelector('main h1')
    if (heading && heading.textContent && heading.textContent.trim()) {
      return heading.textContent.trim()
    }

    var title = (document.title || '').split('–')[0].split('|')[0].trim()
    return title || 'Current Page'
  }

  function toAbsoluteUrl(path) {
    return (
      'https://parthchaudhari.com' +
      (path.charAt(0) === '/' ? path : '/' + path)
    )
  }

  function appendBreadcrumbStructuredData(items) {
    if (document.querySelector('[data-pc-breadcrumb-jsonld]')) {
      return
    }

    var list = []
    for (var i = 0; i < items.length; i += 1) {
      list.push({
        '@type': 'ListItem',
        position: i + 1,
        name: items[i].name,
        item: items[i].url,
      })
    }

    var script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-pc-breadcrumb-jsonld', 'true')
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: list,
    })
    document.head.appendChild(script)
  }

  function appendSectionBreadcrumbIfMissing() {
    if (
      document.querySelector('.pc-breadcrumbs') ||
      document.querySelector('[data-pc-disable-breadcrumbs]')
    ) {
      return
    }

    var main = document.querySelector('main')
    if (!main) {
      return
    }

    var path = normalizePath(window.location.pathname || '/')
    var root = getBreadcrumbRoot(path)
    if (!root) {
      return
    }

    var homeCrumb = { name: 'Home', url: toAbsoluteUrl('/') }
    var rootCrumb = { name: root.label, url: toAbsoluteUrl(root.href) }
    var currentPath = window.location.pathname || '/'
    var currentUrl = toAbsoluteUrl(currentPath)
    var currentLabel = getCurrentPageLabel()

    var nav = document.createElement('nav')
    nav.className = 'pc-breadcrumbs'
    nav.setAttribute('aria-label', 'Breadcrumb')
    nav.innerHTML =
      '<ol class="pc-breadcrumbs__list">' +
      '<li class="pc-breadcrumbs__item"><a href="/">Home</a></li>' +
      '<li class="pc-breadcrumbs__item"><a href="' +
      root.href +
      '">' +
      root.label +
      '</a></li>' +
      '<li class="pc-breadcrumbs__item" aria-current="page">' +
      currentLabel +
      '</li>' +
      '</ol>'

    if (main.firstElementChild) {
      main.insertBefore(nav, main.firstElementChild)
    } else {
      main.appendChild(nav)
    }

    appendBreadcrumbStructuredData([
      homeCrumb,
      rootCrumb,
      { name: currentLabel, url: currentUrl },
    ])
  }

  function appendSiteStructuredDataIfMissing() {
    if (document.querySelector('[data-pc-site-jsonld]')) {
      return
    }

    var script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-pc-site-jsonld', 'true')
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://parthchaudhari.com/#organization',
          name: SITE_BRAND,
          url: 'https://parthchaudhari.com/',
          logo: 'https://parthchaudhari.com/assets/img/vet-favicon.svg',
          description:
            'Veterinary calculator and study platform for dog and cat clinical workflows, drug dosing math, emergency tools, and NAVLE preparation.',
          knowsAbout: [
            'Veterinary calculators',
            'Dog and cat dose calculation',
            'Veterinary drug calculator',
            'Emergency and critical care workflows',
            'NAVLE preparation',
          ],
          sameAs: ['https://parthchaudhari.com/about.html'],
        },
        {
          '@type': 'WebSite',
          '@id': 'https://parthchaudhari.com/#website',
          name: SITE_BRAND,
          url: 'https://parthchaudhari.com/',
          inLanguage: 'en',
          description:
            'Professional veterinary calculators and clinical reference workflows for clinic teams and students.',
          potentialAction: {
            '@type': 'SearchAction',
            target:
              'https://parthchaudhari.com/search.html?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
          publisher: {
            '@id': 'https://parthchaudhari.com/#organization',
          },
        },
      ],
    })
    document.head.appendChild(script)
  }

  function recordLastLearningLocation() {
    var path = window.location.pathname || '/'
    var isLearningPath =
      path.indexOf('/study/') === 0 ||
      path.indexOf('/bridge/') === 0 ||
      path.indexOf('/tools/') === 0

    if (!isLearningPath) {
      return
    }

    try {
      localStorage.setItem(
        'pc_last_learning_url_v1',
        path + (window.location.search || '')
      )
      localStorage.setItem(
        'pc_last_learning_seen_at_v1',
        new Date().toISOString()
      )
    } catch (error) {
      // Best effort persistence.
    }
  }

  function safeGetItem(key) {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      return null
    }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      return false
    }
  }

  function createId(prefix) {
    var seed = String(Math.random()).slice(2, 8) + String(Date.now()).slice(-6)
    return prefix + '_' + seed
  }

  function readOrCreateId(storageKey, prefix) {
    var existing = safeGetItem(storageKey)
    if (existing) {
      return existing
    }
    var next = createId(prefix)
    safeSetItem(storageKey, next)
    return next
  }

  function toIsoDateOnly(dateInput) {
    var date = dateInput instanceof Date ? dateInput : new Date(dateInput)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    return date.toISOString().slice(0, 10)
  }

  function readAnalyticsBuffer() {
    var raw = safeGetItem(ANALYTICS_BUFFER_KEY)
    if (!raw) {
      return []
    }
    try {
      var parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return []
    }
  }

  function writeAnalyticsBuffer(buffer) {
    if (!Array.isArray(buffer)) {
      return
    }
    safeSetItem(
      ANALYTICS_BUFFER_KEY,
      JSON.stringify(buffer.slice(-ANALYTICS_BUFFER_LIMIT))
    )
  }

  function getPageTemplate(path) {
    if (!path) {
      return 'unknown'
    }
    if (path === '/' || path === '/index.html') {
      return 'home'
    }
    if (
      path.indexOf('/tools/') === 0 &&
      path.indexOf('/tools/index.html') === -1
    ) {
      return 'tool'
    }
    if (
      path === '/tools/' ||
      path.indexOf('/veterinary-calculators') === 0 ||
      startsWithAny(normalizePath(path), TOOL_LANDING_PATHS)
    ) {
      return 'tools_hub'
    }
    if (path.indexOf('/study/navle/practice/') === 0) {
      return 'practice'
    }
    if (path.indexOf('/study/navle/practice') === 0) {
      return 'practice'
    }
    if (
      path.indexOf('/study/') === 0 ||
      startsWithAny(normalizePath(path), STUDY_LANDING_PATHS)
    ) {
      return 'topic'
    }
    if (
      path.indexOf('/reference/') === 0 ||
      path.indexOf('/dog-cat-normal-values') === 0 ||
      path.indexOf('/sources-and-limitations') === 0
    ) {
      return 'reference'
    }
    if (path.indexOf('/bridge/') === 0) {
      return 'bridge'
    }
    if (path.indexOf('/pricing/') === 0 || path === '/pricing') {
      return 'pricing'
    }
    return 'content'
  }

  function getPathForAnalytics() {
    return normalizePath(window.location.pathname || '/')
  }

  function parseQueryValue(url, key) {
    var queryIndex = url.indexOf('?')
    if (queryIndex === -1) {
      return ''
    }
    var query = url.slice(queryIndex + 1).split('&')
    for (var i = 0; i < query.length; i += 1) {
      var part = query[i].split('=')
      if (decodeURIComponent(part[0] || '') === key) {
        return decodeURIComponent((part[1] || '').replace(/\+/g, ' '))
      }
    }
    return ''
  }

  function createAnalyticsPayload(params) {
    var path = getPathForAnalytics()
    return Object.assign(
      {
        page_path: path,
        page_template: getPageTemplate(path),
        page_title: document.title || '',
        referrer: document.referrer || '',
        session_id: readOrCreateId(ANALYTICS_SESSION_KEY, 'sess'),
        visitor_id: readOrCreateId(ANALYTICS_VISITOR_KEY, 'vis'),
      },
      params || {}
    )
  }

  function trackAnalyticsEvent(name, params) {
    if (!name) {
      return
    }

    var payload = createAnalyticsPayload(params)
    var eventEnvelope = {
      event: name,
      timestamp: new Date().toISOString(),
      params: payload,
    }

    var buffer = readAnalyticsBuffer()
    buffer.push(eventEnvelope)
    writeAnalyticsBuffer(buffer)

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push(Object.assign({ event: name }, payload))

    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload)
    }
  }

  function emitRetentionEvents() {
    var now = new Date()
    var today = toIsoDateOnly(now)
    var previous = safeGetItem(LAST_VISIT_KEY)
    var previousDate = previous ? new Date(previous) : null
    var dayMs = 24 * 60 * 60 * 1000

    if (previousDate && !Number.isNaN(previousDate.getTime())) {
      var deltaDays = Math.floor(
        (now.getTime() - previousDate.getTime()) / dayMs
      )

      if (deltaDays >= 7 && safeGetItem(RETENTION_7D_EMIT_KEY) !== today) {
        trackAnalyticsEvent('returning_user_7d', {
          days_since_last_visit: deltaDays,
        })
        safeSetItem(RETENTION_7D_EMIT_KEY, today)
      }

      if (deltaDays >= 30 && safeGetItem(RETENTION_30D_EMIT_KEY) !== today) {
        trackAnalyticsEvent('returning_user_30d', {
          days_since_last_visit: deltaDays,
        })
        safeSetItem(RETENTION_30D_EMIT_KEY, today)
      }
    }

    safeSetItem(LAST_VISIT_KEY, now.toISOString())
  }

  function inferToolName(path) {
    var file = path.split('/').pop() || ''
    if (!file) {
      return 'unknown_tool'
    }
    return file.replace('.html', '').replace(/[-_]+/g, ' ')
  }

  function trackCorePageEvents() {
    var path = getPathForAnalytics()
    trackAnalyticsEvent('landing_page_view', {
      landing_path: path,
    })

    emitRetentionEvents()

    if (path === '/pricing' || path === '/pricing/') {
      trackAnalyticsEvent('pricing_viewed', {
        plan_primary: 'premium_9_usd_month',
      })
    }
  }

  function bindGlobalClickTracking() {
    document.addEventListener(
      'click',
      function (event) {
        var target = event.target
        if (!target || !target.closest) {
          return
        }

        var link = target.closest('a[href]')
        if (!link) {
          return
        }

        var href = link.getAttribute('href') || ''
        if (!href) {
          return
        }

        if (href.indexOf('/pricing/') === 0) {
          trackAnalyticsEvent('paywall_viewed', {
            source_path: getPathForAnalytics(),
            cta_label: (link.textContent || '').trim().slice(0, 64),
          })
        }

        if (href.indexOf('/account/subscription/') === 0) {
          trackAnalyticsEvent('checkout_started', {
            plan: parseQueryValue(href, 'plan') || 'premium',
          })
        }
      },
      { passive: true }
    )
  }

  function bindToolUsageTracking() {
    var path = getPathForAnalytics()
    if (path.indexOf('/tools/') !== 0 || path === '/tools') {
      return
    }

    var submitted = false
    document.addEventListener(
      'submit',
      function (event) {
        var form = event.target
        if (!form || submitted) {
          return
        }
        if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
          return
        }
        submitted = true
        trackAnalyticsEvent('tool_used', {
          tool_name: inferToolName(path),
        })
        trackAnalyticsEvent('calculator_completed', {
          tool_name: inferToolName(path),
        })
      },
      true
    )
  }

  function bindPracticePaywallObserver() {
    var path = getPathForAnalytics()
    if (path.indexOf('/study/navle/practice/') !== 0) {
      return
    }

    function isVisible(node) {
      if (!node) {
        return false
      }
      if (node.hasAttribute('hidden')) {
        return false
      }
      if (node.style && node.style.display === 'none') {
        return false
      }
      return true
    }

    var gate = document.getElementById('gate-modal')
    var paymentGate = document.getElementById('payment-gate')

    if (gate) {
      var gateObserver = new MutationObserver(function () {
        if (isVisible(gate)) {
          trackAnalyticsEvent('paywall_viewed', { source: 'free_limit_gate' })
        }
      })
      gateObserver.observe(gate, {
        attributes: true,
        attributeFilter: ['style', 'hidden', 'class'],
      })
    }

    if (paymentGate) {
      var paymentObserver = new MutationObserver(function () {
        if (isVisible(paymentGate)) {
          trackAnalyticsEvent('paywall_viewed', { source: 'payment_gate' })
        }
      })
      paymentObserver.observe(paymentGate, {
        attributes: true,
        attributeFilter: ['style', 'hidden', 'class'],
      })
    }
  }

  function trackPurchaseFromQuery() {
    var path = getPathForAnalytics()
    if (path.indexOf('/account/subscription/') !== 0) {
      return
    }

    var search = window.location.search || ''
    var status =
      parseQueryValue(search, 'status') || parseQueryValue(search, 'purchase')
    if (!status) {
      return
    }

    if (String(status).toLowerCase() === 'success') {
      trackAnalyticsEvent('purchase_completed', {
        plan: parseQueryValue(search, 'plan') || 'premium',
      })
    }
  }

  function exposeAnalyticsApi() {
    window.pcAnalytics = window.pcAnalytics || {}
    window.pcAnalytics.track = trackAnalyticsEvent
  }

  function initAnalytics() {
    exposeAnalyticsApi()
    trackCorePageEvents()
    bindGlobalClickTracking()
    bindToolUsageTracking()
    bindPracticePaywallObserver()
    trackPurchaseFromQuery()
  }

  function loadRouteEnhancements() {
    var path = getPathForAnalytics()
    if (path === '/' || path === '/index.html') {
      loadScriptAsync('/assets/js/home-popup.js')
    }
  }

  function canRegisterServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return false
    }

    if (window.location.protocol === 'https:') {
      return true
    }

    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
  }

  function registerServiceWorker() {
    if (!canRegisterServiceWorker()) {
      return
    }

    navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { scope: '/' })
      .then(function (registration) {
        if (!registration) {
          return
        }

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        registration.addEventListener('updatefound', function () {
          var worker = registration.installing
          if (!worker) {
            return
          }

          worker.addEventListener('statechange', function () {
            if (
              worker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              worker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })

        window.setTimeout(function () {
          registration.update().catch(function () {
            // Best effort update check.
          })
        }, 45000)
      })
      .catch(function () {
        // Ignore registration failures.
      })
  }

  function clamp(value, min, max) {
    if (value < min) {
      return min
    }
    if (value > max) {
      return max
    }
    return value
  }

  function toScale(value) {
    var parsed = Number(value)
    if (!Number.isFinite(parsed)) {
      return DEFAULT_TEXT_SCALE
    }
    return clamp(parsed, MIN_TEXT_SCALE, MAX_TEXT_SCALE)
  }

  function readStoredTextScale() {
    try {
      return toScale(localStorage.getItem(TEXT_SCALE_KEY))
    } catch (error) {
      return DEFAULT_TEXT_SCALE
    }
  }

  function writeStoredTextScale(scale) {
    try {
      localStorage.setItem(TEXT_SCALE_KEY, String(scale))
    } catch (error) {
      // Best effort persistence.
    }
  }

  function readDesktopViewPreference() {
    try {
      return localStorage.getItem(DESKTOP_VIEW_KEY) === 'true'
    } catch (error) {
      return false
    }
  }

  function writeDesktopViewPreference(enabled) {
    try {
      localStorage.setItem(DESKTOP_VIEW_KEY, enabled ? 'true' : 'false')
    } catch (error) {
      // Best effort persistence.
    }
  }

  function readDesktopViewRequestFromQuery() {
    var search = window.location.search || ''
    if (!search) {
      return null
    }

    try {
      var params = new URLSearchParams(search)
      var value =
        params.get('desktop_view') ||
        params.get('desktop') ||
        params.get('view_mode')
      if (!value) {
        return null
      }

      var normalized = String(value).toLowerCase()
      if (
        normalized === '1' ||
        normalized === 'true' ||
        normalized === 'on' ||
        normalized === 'desktop'
      ) {
        return true
      }
      if (
        normalized === '0' ||
        normalized === 'false' ||
        normalized === 'off' ||
        normalized === 'mobile'
      ) {
        return false
      }
      return null
    } catch (error) {
      return null
    }
  }

  function ensureViewportMeta() {
    var viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      return viewport
    }

    var created = document.createElement('meta')
    created.setAttribute('name', 'viewport')
    created.setAttribute('content', 'width=device-width, initial-scale=1.0')
    document.head.appendChild(created)
    return created
  }

  function setDesktopViewport() {
    var viewport = ensureViewportMeta()
    if (!viewport) {
      return
    }

    if (!desktopViewDefaultViewport) {
      desktopViewDefaultViewport =
        viewport.getAttribute('content') ||
        'width=device-width, initial-scale=1.0'
    }

    var width =
      window.innerWidth || (window.screen && window.screen.width) || 390
    var initialScale = clamp(width / DESKTOP_WIDTH, 0.22, 1)
    viewport.setAttribute(
      'content',
      'width=' +
        DESKTOP_WIDTH +
        ', initial-scale=' +
        initialScale.toFixed(2) +
        ', minimum-scale=0.2, maximum-scale=5, user-scalable=yes'
    )
    document.documentElement.classList.add('pc-force-desktop-view')
  }

  function clearDesktopViewport() {
    var viewport = ensureViewportMeta()
    if (!viewport) {
      return
    }

    var fallback =
      desktopViewDefaultViewport || 'width=device-width, initial-scale=1.0'
    viewport.setAttribute('content', fallback)
    document.documentElement.classList.remove('pc-force-desktop-view')
  }

  function applyDesktopView(enabled) {
    if (enabled) {
      setDesktopViewport()
    } else {
      clearDesktopViewport()
    }
    writeDesktopViewPreference(!!enabled)
  }

  function applyTextScale(scale) {
    var normalized = toScale(scale)
    document.documentElement.style.fontSize =
      (DEFAULT_FONT_SIZE * normalized).toFixed(2) + 'px'
    document.documentElement.setAttribute(
      'data-pc-text-scale',
      normalized.toFixed(2)
    )
    writeStoredTextScale(normalized)
  }

  function updateTextScaleLabel(scale) {
    var label = document.getElementById('pc-view-text-scale-value')
    if (!label) {
      return
    }
    label.textContent = Math.round(scale * 100) + '%'
  }

  function updateDesktopLabel(enabled) {
    var label = document.getElementById('pc-view-desktop-label')
    if (!label) {
      return
    }
    label.textContent = enabled ? 'Desktop view: On' : 'Desktop view: Off'
  }

  function toggleViewPanel(forceOpen) {
    var panel = document.getElementById('pc-view-panel')
    var trigger = document.getElementById('pc-view-trigger')
    if (!panel || !trigger) {
      return
    }

    var shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.hidden
    panel.hidden = !shouldOpen
    trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false')
  }

  function injectViewControls() {
    if (
      document.getElementById('pc-view-controls-text') ||
      document.getElementById('pc-view-controls-desktop')
    ) {
      return
    }

    var textWrapper = document.createElement('div')
    textWrapper.id = 'pc-view-controls-text'
    textWrapper.className = 'pc-view-controls pc-view-controls--left'

    var trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.id = 'pc-view-trigger'
    trigger.className = 'pc-view-trigger'
    trigger.setAttribute('aria-label', 'Open text size controls')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.textContent = 'Aa'

    var panel = document.createElement('div')
    panel.id = 'pc-view-panel'
    panel.className = 'pc-view-panel'
    panel.hidden = true
    panel.innerHTML =
      '<p class="pc-view-panel__title">Text Size</p>' +
      '<div class="pc-view-scale-row" role="group" aria-label="Text size controls">' +
      '<button type="button" class="pc-view-mini-btn" id="pc-view-text-down" aria-label="Decrease text size">A-</button>' +
      '<span id="pc-view-text-scale-value" class="pc-view-scale-value">100%</span>' +
      '<button type="button" class="pc-view-mini-btn" id="pc-view-text-up" aria-label="Increase text size">A+</button>' +
      '<button type="button" class="pc-view-mini-btn" id="pc-view-text-reset" aria-label="Reset text size">Reset</button>' +
      '</div>'

    textWrapper.appendChild(trigger)
    textWrapper.appendChild(panel)
    document.body.appendChild(textWrapper)

    var desktopWrapper = document.createElement('div')
    desktopWrapper.id = 'pc-view-controls-desktop'
    desktopWrapper.className = 'pc-view-controls pc-view-controls--right'

    var desktopButton = document.createElement('button')
    desktopButton.type = 'button'
    desktopButton.className =
      'pc-view-desktop-toggle pc-view-desktop-toggle--floating'
    desktopButton.id = 'pc-view-desktop-toggle'
    desktopButton.setAttribute('aria-label', 'Toggle desktop view')
    desktopButton.innerHTML =
      '<span id="pc-view-desktop-label">Desktop view: Off</span>'

    desktopWrapper.appendChild(desktopButton)
    document.body.appendChild(desktopWrapper)

    trigger.addEventListener('click', function () {
      toggleViewPanel()
    })

    document
      .getElementById('pc-view-text-down')
      .addEventListener('click', function () {
        var currentScale = toScale(readStoredTextScale())
        var nextScale = clamp(
          currentScale - TEXT_SCALE_STEP,
          MIN_TEXT_SCALE,
          MAX_TEXT_SCALE
        )
        applyTextScale(nextScale)
        updateTextScaleLabel(nextScale)
      })

    document
      .getElementById('pc-view-text-up')
      .addEventListener('click', function () {
        var currentScale = toScale(readStoredTextScale())
        var nextScale = clamp(
          currentScale + TEXT_SCALE_STEP,
          MIN_TEXT_SCALE,
          MAX_TEXT_SCALE
        )
        applyTextScale(nextScale)
        updateTextScaleLabel(nextScale)
      })

    document
      .getElementById('pc-view-text-reset')
      .addEventListener('click', function () {
        applyTextScale(DEFAULT_TEXT_SCALE)
        updateTextScaleLabel(DEFAULT_TEXT_SCALE)
      })

    desktopButton.addEventListener('click', function () {
      var enabled = !readDesktopViewPreference()
      applyDesktopView(enabled)
      updateDesktopLabel(enabled)
    })

    document.addEventListener('click', function (event) {
      if (!textWrapper.contains(event.target)) {
        toggleViewPanel(false)
      }
    })

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        toggleViewPanel(false)
      }
    })

    var initialScale = readStoredTextScale()
    applyTextScale(initialScale)
    updateTextScaleLabel(initialScale)

    var desktopRequested = readDesktopViewRequestFromQuery()
    var desktopEnabled =
      desktopRequested === null ? readDesktopViewPreference() : desktopRequested
    applyDesktopView(desktopEnabled)
    updateDesktopLabel(desktopEnabled)

    window.addEventListener('pc-request-desktop-view', function (event) {
      var requested = !!(
        event &&
        event.detail &&
        event.detail.enabled !== false
      )
      applyDesktopView(requested)
      updateDesktopLabel(requested)
    })

    var resizeTimer = null
    window.addEventListener(
      'resize',
      function () {
        if (!readDesktopViewPreference()) {
          return
        }
        clearTimeout(resizeTimer)
        resizeTimer = window.setTimeout(function () {
          setDesktopViewport()
        }, 120)
      },
      { passive: true }
    )
  }

  function initUserViewControls() {
    var scale = readStoredTextScale()
    applyTextScale(scale)
    injectViewControls()
  }

  function init() {
    ensureSkipLink()
    applyBrandLabel()
    ensureCanonicalLink()
    normalizePortalNav()
    bindPortalMenuKeyboardSupport()
    normalizeLegacyNav()
    applyIndicator(isLoggedInFromCache())

    scheduleNonCritical(function () {
      appendSectionBreadcrumbIfMissing()
      appendGlobalFooterIfMissing()
      appendSiteStructuredDataIfMissing()
      recordLastLearningLocation()
      initUserViewControls()
      initGlobalMotionSync()
    }, 120)

    scheduleNonCritical(function () {
      initAnalyticsIfAllowed()
    }, 60)

    scheduleNonCritical(function () {
      loadRouteEnhancements()
    }, 200)

    scheduleNonCritical(function () {
      registerServiceWorker()
    }, 260)

    window.addEventListener('storage', function (event) {
      if (event.key === AUTH_STATE_KEY) {
        applyIndicator(event.newValue === 'signed_in')
      }
    })

    window.addEventListener('pc-auth-status-change', function (event) {
      var loggedIn = !!(event && event.detail && event.detail.loggedIn)
      applyIndicator(loggedIn)
    })

    window.addEventListener('pc-consent-updated', function () {
      initAnalyticsIfAllowed()
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
