;(function () {
  'use strict'

  var AUTHOR_STATUS_CONTENT = 'NAVLE-candidate-unlicensed'
  var AUTHOR_STATUS_NAME = 'author-status'
  var DISCLAIMER_DISMISS_KEY = 'pc_edu_disclaimer_dismissed_at_v1'
  var DISCLAIMER_HIDE_MS = 7 * 24 * 60 * 60 * 1000
  var CONSENT_COOKIE_NAME = 'pc_consent_v1'
  var CONSENT_COOKIE_MAX_AGE = 400 * 24 * 60 * 60
  var CONSENT_VERSION = 1
  var CONSENT_REPROMPT_MS = 365 * 24 * 60 * 60 * 1000
  var CONSENT_KEY_PHRASE = 'pc-consent-key-v1-parthchaudhari.com'
  var TOOL_ACK_KEY = 'pc_tool_not_clinical_use_ack_v1'

  var state = {
    consent: null,
    cryptoKeyPromise: null,
  }

  function safeGetLocalStorage(key) {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      return null
    }
  }

  function safeSetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      return false
    }
  }

  function supportsConsentCrypto() {
    return !!(
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.getRandomValues === 'function' &&
      typeof window.TextEncoder === 'function' &&
      typeof window.TextDecoder === 'function'
    )
  }

  function bytesToBase64(bytes) {
    var binary = ''
    for (var i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  function base64ToBytes(value) {
    var binary = window.atob(value)
    var bytes = new Uint8Array(binary.length)
    for (var i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  function getConsentCookieValue() {
    var cookies = document.cookie ? document.cookie.split(';') : []
    for (var i = 0; i < cookies.length; i += 1) {
      var entry = cookies[i].trim()
      if (entry.indexOf(CONSENT_COOKIE_NAME + '=') === 0) {
        return decodeURIComponent(entry.slice(CONSENT_COOKIE_NAME.length + 1))
      }
    }
    return ''
  }

  function setConsentCookie(value) {
    if (!value) {
      return
    }

    var secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie =
      CONSENT_COOKIE_NAME +
      '=' +
      encodeURIComponent(value) +
      '; path=/; max-age=' +
      CONSENT_COOKIE_MAX_AGE +
      '; SameSite=Lax' +
      secureFlag
  }

  function ensureMetaTag(name, content) {
    var selector = 'meta[name="' + name + '"]'
    var node = document.querySelector(selector)
    if (!node) {
      node = document.createElement('meta')
      node.setAttribute('name', name)
      document.head.appendChild(node)
    }
    node.setAttribute('content', content)
  }

  function ensureHttpEquivMeta(httpEquiv, content) {
    var selector = 'meta[http-equiv="' + httpEquiv + '"]'
    var node = document.querySelector(selector)
    if (!node) {
      node = document.createElement('meta')
      node.setAttribute('http-equiv', httpEquiv)
      document.head.appendChild(node)
    }
    node.setAttribute('content', content)
  }

  function ensureAuthorStatusMeta() {
    ensureMetaTag(AUTHOR_STATUS_NAME, AUTHOR_STATUS_CONTENT)
  }

  function ensureSecurityMetaDefaults() {
    ensureMetaTag('referrer', 'strict-origin-when-cross-origin')
    ensureHttpEquivMeta(
      'Content-Security-Policy-Report-Only',
      "default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-src 'self'"
    )
  }

  function enforceHttpsRedirect() {
    var isLocalHost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (window.location.protocol === 'http:' && !isLocalHost) {
      var target =
        'https://' +
        window.location.host +
        window.location.pathname +
        window.location.search +
        window.location.hash
      window.location.replace(target)
    }
  }

  function shouldShowDisclaimerBanner() {
    var lastDismissed = Number(safeGetLocalStorage(DISCLAIMER_DISMISS_KEY) || 0)
    if (!Number.isFinite(lastDismissed) || lastDismissed <= 0) {
      return true
    }

    return Date.now() - lastDismissed >= DISCLAIMER_HIDE_MS
  }

  function toggleBannerLayoutClass(enabled) {
    if (!document.documentElement) {
      return
    }
    document.documentElement.classList.toggle('pc-has-legal-banner', !!enabled)
  }

  function addGlobalDisclaimerBanner() {
    if (document.getElementById('pc-global-legal-banner')) {
      return
    }

    if (!shouldShowDisclaimerBanner()) {
      toggleBannerLayoutClass(false)
      return
    }

    var banner = document.createElement('aside')
    banner.id = 'pc-global-legal-banner'
    banner.className = 'pc-legal-banner'
    banner.setAttribute('role', 'note')
    banner.innerHTML =
      '<p class="pc-legal-banner__text">' +
      '<strong>&#9888; EDUCATIONAL USE ONLY:</strong> Content created by a NAVLE candidate/veterinary assistant for exam preparation. Not licensed veterinary advice. Not affiliated with NAVLE or ICVA.' +
      '</p>' +
      '<button type="button" class="pc-legal-banner__dismiss" aria-label="Dismiss educational use notice">Dismiss</button>'

    var dismissBtn = banner.querySelector('.pc-legal-banner__dismiss')
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        safeSetLocalStorage(DISCLAIMER_DISMISS_KEY, String(Date.now()))
        banner.remove()
        toggleBannerLayoutClass(false)
      })
    }

    document.body.appendChild(banner)
    toggleBannerLayoutClass(true)
  }

  function buildConsentPayload(analyticsEnabled, functionalEnabled) {
    return {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: !!analyticsEnabled,
      functional: !!functionalEnabled,
    }
  }

  function isConsentFresh(consent) {
    if (!consent || !consent.timestamp) {
      return false
    }

    var stamp = Date.parse(consent.timestamp)
    if (!Number.isFinite(stamp)) {
      return false
    }

    return Date.now() - stamp < CONSENT_REPROMPT_MS
  }

  function createConsentEvent(consent) {
    if (typeof window.CustomEvent === 'function') {
      return new CustomEvent('pc-consent-updated', {
        detail: { consent: consent || null },
      })
    }

    var legacyEvent = document.createEvent('Event')
    legacyEvent.initEvent('pc-consent-updated', true, true)
    legacyEvent.detail = { consent: consent || null }
    return legacyEvent
  }

  function emitConsentEvent(consent) {
    window.dispatchEvent(createConsentEvent(consent))
  }

  function getConsentCryptoKey() {
    if (!supportsConsentCrypto()) {
      return Promise.resolve(null)
    }

    if (state.cryptoKeyPromise) {
      return state.cryptoKeyPromise
    }

    state.cryptoKeyPromise = window.crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(CONSENT_KEY_PHRASE))
      .then(function (hashBuffer) {
        return window.crypto.subtle.importKey(
          'raw',
          hashBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        )
      })
      .catch(function () {
        return null
      })

    return state.cryptoKeyPromise
  }

  function encryptConsent(rawJson) {
    if (!supportsConsentCrypto()) {
      return Promise.resolve('plain:' + window.btoa(rawJson))
    }

    return getConsentCryptoKey().then(function (key) {
      if (!key) {
        return 'plain:' + window.btoa(rawJson)
      }

      var iv = window.crypto.getRandomValues(new Uint8Array(12))
      return window.crypto.subtle
        .encrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          new TextEncoder().encode(rawJson)
        )
        .then(function (cipherBuffer) {
          var ivPart = bytesToBase64(iv)
          var cipherPart = bytesToBase64(new Uint8Array(cipherBuffer))
          return 'enc:' + ivPart + '.' + cipherPart
        })
        .catch(function () {
          return 'plain:' + window.btoa(rawJson)
        })
    })
  }

  function decryptConsent(rawValue) {
    if (!rawValue) {
      return Promise.resolve('')
    }

    if (rawValue.indexOf('plain:') === 0) {
      try {
        return Promise.resolve(window.atob(rawValue.slice(6)))
      } catch (error) {
        return Promise.resolve('')
      }
    }

    if (rawValue.indexOf('enc:') !== 0 || !supportsConsentCrypto()) {
      return Promise.resolve('')
    }

    var payload = rawValue.slice(4)
    var parts = payload.split('.')
    if (parts.length !== 2) {
      return Promise.resolve('')
    }

    return getConsentCryptoKey().then(function (key) {
      if (!key) {
        return ''
      }

      try {
        var ivBytes = base64ToBytes(parts[0])
        var cipherBytes = base64ToBytes(parts[1])
        return window.crypto.subtle
          .decrypt({ name: 'AES-GCM', iv: ivBytes }, key, cipherBytes)
          .then(function (plainBuffer) {
            return new TextDecoder().decode(plainBuffer)
          })
          .catch(function () {
            return ''
          })
      } catch (error) {
        return ''
      }
    })
  }

  function readConsentFromCookie() {
    var raw = getConsentCookieValue()
    if (!raw) {
      return Promise.resolve(null)
    }

    return decryptConsent(raw).then(function (jsonText) {
      if (!jsonText) {
        return null
      }
      try {
        var parsed = JSON.parse(jsonText)
        return parsed && typeof parsed === 'object' ? parsed : null
      } catch (error) {
        return null
      }
    })
  }

  function persistConsent(consent) {
    var safeConsent = consent && typeof consent === 'object' ? consent : null
    if (!safeConsent) {
      return Promise.resolve(false)
    }

    return encryptConsent(JSON.stringify(safeConsent)).then(function (encoded) {
      setConsentCookie(encoded)
      state.consent = safeConsent
      emitConsentEvent(safeConsent)
      return true
    })
  }

  function loadDeferredScriptsForCategory(category) {
    if (!category) {
      return
    }

    var selector =
      'script[type="text/plain"][data-pc-consent-category="' + category + '"]'
    var pendingScripts = document.querySelectorAll(selector)
    for (var i = 0; i < pendingScripts.length; i += 1) {
      var sourceScript = pendingScripts[i]
      var script = document.createElement('script')

      if (sourceScript.src) {
        script.src = sourceScript.src
        script.async = sourceScript.async
        script.defer = sourceScript.defer
      } else {
        script.textContent = sourceScript.textContent || ''
      }

      var attrs = sourceScript.attributes
      for (var j = 0; j < attrs.length; j += 1) {
        var attr = attrs[j]
        if (attr.name === 'type' || attr.name === 'src') {
          continue
        }
        if (attr.name.indexOf('data-pc-consent-') === 0) {
          continue
        }
        script.setAttribute(attr.name, attr.value)
      }

      sourceScript.parentNode.insertBefore(script, sourceScript.nextSibling)
      sourceScript.remove()
    }
  }

  function ensureCookieBanner(consent) {
    var existing = document.getElementById('pc-cookie-banner')
    if (existing) {
      existing.remove()
    }

    var isFresh = isConsentFresh(consent)
    if (isFresh) {
      if (consent.analytics) {
        loadDeferredScriptsForCategory('analytics')
      }
      if (consent.functional) {
        loadDeferredScriptsForCategory('functional')
      }
      emitConsentEvent(consent)
      return
    }

    var banner = document.createElement('section')
    banner.id = 'pc-cookie-banner'
    banner.className = 'pc-cookie-banner'
    banner.innerHTML =
      '<div class="pc-cookie-banner__surface" role="dialog" aria-live="polite" aria-label="Cookie preferences">' +
      '<p class="pc-cookie-banner__title">Cookie Preferences</p>' +
      '<p class="pc-cookie-banner__copy">Choose which optional categories you allow. Essential cookies are always enabled.</p>' +
      '<label class="pc-cookie-banner__row">' +
      '<input type="checkbox" checked disabled aria-disabled="true">' +
      '<span><strong>Essential</strong>: Required for navigation, security, and account session basics.</span>' +
      '</label>' +
      '<label class="pc-cookie-banner__row">' +
      '<input type="checkbox" id="pc-consent-analytics">' +
      '<span><strong>Analytics (Optional)</strong>: Usage measurement and performance trends.</span>' +
      '</label>' +
      '<label class="pc-cookie-banner__row">' +
      '<input type="checkbox" id="pc-consent-functional">' +
      '<span><strong>Functional (Optional)</strong>: Enhanced convenience features and saved preferences.</span>' +
      '</label>' +
      '<div class="pc-cookie-banner__actions">' +
      '<button type="button" class="pc-btn pc-btn--primary" id="pc-consent-accept-all">Accept All</button>' +
      '<button type="button" class="pc-btn pc-btn--secondary" id="pc-consent-reject">Reject Optional</button>' +
      '<button type="button" class="pc-btn pc-btn--ghost" id="pc-consent-save">Save Preferences</button>' +
      '</div>' +
      '</div>'

    document.body.appendChild(banner)

    function closeBanner() {
      banner.remove()
    }

    function applyConsent(analyticsAllowed, functionalAllowed) {
      var payload = buildConsentPayload(analyticsAllowed, functionalAllowed)
      persistConsent(payload).then(function () {
        if (payload.analytics) {
          loadDeferredScriptsForCategory('analytics')
        }
        if (payload.functional) {
          loadDeferredScriptsForCategory('functional')
        }
        closeBanner()
      })
    }

    var acceptAllBtn = document.getElementById('pc-consent-accept-all')
    var rejectBtn = document.getElementById('pc-consent-reject')
    var saveBtn = document.getElementById('pc-consent-save')
    var analyticsInput = document.getElementById('pc-consent-analytics')
    var functionalInput = document.getElementById('pc-consent-functional')

    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', function () {
        applyConsent(true, true)
      })
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', function () {
        applyConsent(false, false)
      })
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var analyticsAllowed = analyticsInput ? !!analyticsInput.checked : false
        var functionalAllowed = functionalInput
          ? !!functionalInput.checked
          : false
        applyConsent(analyticsAllowed, functionalAllowed)
      })
    }
  }

  function isToolPage(path) {
    if (!path) {
      return false
    }

    if (path === '/tools' || path === '/tools/') {
      return false
    }

    return path.indexOf('/tools/') === 0
  }

  function addToolEducationalWarning() {
    var path = window.location.pathname || '/'
    if (!isToolPage(path)) {
      return
    }

    if (document.querySelector('[data-pc-tool-warning]')) {
      return
    }

    var host = document.querySelector('main') || document.body
    if (!host) {
      return
    }

    var wrapper = document.createElement('div')
    wrapper.className = 'pc-tool-education-warning'
    wrapper.setAttribute('data-pc-tool-warning', 'true')

    var previouslyAcknowledged = safeGetLocalStorage(TOOL_ACK_KEY) === 'true'

    wrapper.innerHTML =
      '<p class="pc-tool-education-warning__headline">Educational Calculation Practice Only</p>' +
      '<p class="pc-tool-education-warning__copy">For educational calculation practice only. Verify with current formularies.</p>' +
      '<label class="pc-tool-education-warning__ack">' +
      '<input type="checkbox" id="pc-tool-ack-checkbox" ' +
      (previouslyAcknowledged ? 'checked' : '') +
      '>' +
      '<span>I understand this is not for clinical use.</span>' +
      '</label>' +
      '<p id="pc-tool-ack-message" class="pc-tool-education-warning__message" aria-live="polite"></p>'

    if (main.firstElementChild) {
      main.insertBefore(wrapper, main.firstElementChild)
    } else {
      main.appendChild(wrapper)
    }

    var checkbox = document.getElementById('pc-tool-ack-checkbox')
    if (checkbox) {
      checkbox.addEventListener('change', function () {
        safeSetLocalStorage(TOOL_ACK_KEY, checkbox.checked ? 'true' : 'false')
      })
    }

    document.addEventListener(
      'submit',
      function (event) {
        var target = event.target
        if (!target || !target.closest || !target.closest('main')) {
          return
        }

        if (!checkbox || checkbox.checked) {
          return
        }

        event.preventDefault()
        var message = document.getElementById('pc-tool-ack-message')
        if (message) {
          message.textContent =
            'Please confirm educational-use acknowledgement before generating results.'
        }
        checkbox.focus()
      },
      true
    )
  }

  function appendAttributionNote(text) {
    if (!text) {
      return
    }

    if (document.querySelector('[data-pc-license-attribution]')) {
      return
    }

    var main = document.querySelector('main')
    if (!main) {
      return
    }

    var note = document.createElement('p')
    note.className = 'pc-license-attribution'
    note.setAttribute('data-pc-license-attribution', 'true')
    note.textContent = text
    main.appendChild(note)
  }

  function appendTrademarkFooterIfMissing() {
    if (
      document.querySelector('.pc-footer') ||
      document.querySelector('[data-pc-legal-mini-footer]')
    ) {
      return
    }

    if (!document.body) {
      return
    }

    var footer = document.createElement('footer')
    footer.className = 'pc-legal-mini-footer'
    footer.setAttribute('data-pc-legal-mini-footer', 'true')
    footer.innerHTML =
      '<p>NAVLE&reg; is a registered trademark of ICVA. Not affiliated with NAVLE, ICVA, or any veterinary licensing board.</p>'
    document.body.appendChild(footer)
  }

  function addGameAttributionIfNeeded() {
    var path = window.location.pathname || '/'

    if (
      path.indexOf('/play/2048/') === 0 ||
      path === '/games/2048.html' ||
      path.indexOf('/games/2048/') === 0
    ) {
      appendAttributionNote('© 2014 Gabriele Cirulli - MIT License.')
      return
    }

    if (path.indexOf('/play/vetlex/') === 0) {
      appendAttributionNote('Not affiliated with Wordle or NYT Games.')
    }
  }

  function appendGameframeDisclaimer() {
    if (
      !document.body ||
      !document.body.classList.contains('pc-page--gameframe')
    ) {
      return
    }

    if (document.querySelector('[data-pc-gameframe-disclaimer]')) {
      return
    }

    var note = document.createElement('p')
    note.className = 'pc-gameframe-disclaimer'
    note.setAttribute('data-pc-gameframe-disclaimer', 'true')
    note.textContent = 'Educational use only. Not licensed veterinary advice.'
    document.body.appendChild(note)
  }

  function canUseAnalytics() {
    return !!(
      state.consent &&
      state.consent.analytics === true &&
      isConsentFresh(state.consent)
    )
  }

  function canUseFunctional() {
    return !!(
      state.consent &&
      state.consent.functional === true &&
      isConsentFresh(state.consent)
    )
  }

  function initCompliance() {
    enforceHttpsRedirect()
    ensureAuthorStatusMeta()
    ensureSecurityMetaDefaults()
    addGlobalDisclaimerBanner()
    addToolEducationalWarning()
    addGameAttributionIfNeeded()
    appendGameframeDisclaimer()
    window.setTimeout(function () {
      appendTrademarkFooterIfMissing()
    }, 500)

    readConsentFromCookie().then(function (consent) {
      state.consent = consent
      ensureCookieBanner(consent)
    })
  }

  window.pcLegal = window.pcLegal || {}
  window.pcLegal.canUseAnalytics = canUseAnalytics
  window.pcLegal.canUseFunctional = canUseFunctional
  window.pcLegal.getConsent = function () {
    return state.consent || null
  }
  window.pcLegal.openConsentSettings = function () {
    ensureCookieBanner(null)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCompliance, {
      once: true,
    })
  } else {
    initCompliance()
  }
})()
