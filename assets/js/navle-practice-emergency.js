;(function () {
  'use strict'

  var SESSION_KEY = 'pc_navle_practice_emergency_session_v1'
  var FREE_BANK_URL = '/content/navle/questions.json'
  var AUTH_STATE_KEY = 'pc_sync_auth_state'
  var SUPABASE_UMD_URL =
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
  var SUPABASE_CONFIG_URL = '/assets/js/supabase-config.js'
  var SYNC_URL = '/assets/js/sync.js?v=20260213d'

  var currentQuestion = null
  var questionIndex = 0
  var questions = []
  var wasLoggedIn = false
  var authHydrationInFlight = false
  var practiceStartedTracked = false

  function byId(id) {
    return document.getElementById(id)
  }

  function safeParse(value, fallback) {
    try {
      var parsed = JSON.parse(value)
      return parsed !== null ? parsed : fallback
    } catch (error) {
      return fallback
    }
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      return null
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      return false
    }
  }

  function trackEvent(name, params) {
    if (window.pcAnalytics && typeof window.pcAnalytics.track === 'function') {
      window.pcAnalytics.track(name, params || {})
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function getCurrentPath() {
    return window.location.pathname + window.location.search
  }

  function rememberLearningLocation() {
    safeSet('pc_last_learning_url_v1', getCurrentPath())
    safeSet('pc_last_learning_seen_at_v1', new Date().toISOString())
  }

  function readSessionIndex() {
    var session = safeParse(safeGet(SESSION_KEY) || '{}', {})
    if (session && Number.isFinite(Number(session.index))) {
      return Math.max(0, Number(session.index))
    }
    return 0
  }

  function writeSessionIndex(index) {
    var normalized = Math.max(0, Number(index) || 0)
    safeSet(SESSION_KEY, JSON.stringify({ index: normalized }))
  }

  function loadScriptOnce(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]')
      if (existing && existing.getAttribute('data-pc-loaded') === 'true') {
        resolve()
        return
      }

      if (existing) {
        if (existing.getAttribute('data-pc-loading') === 'true') {
          existing.addEventListener(
            'load',
            function () {
              resolve()
            },
            { once: true }
          )
          existing.addEventListener(
            'error',
            function () {
              reject(new Error('Failed to load ' + src))
            },
            { once: true }
          )
          return
        }
        resolve()
        return
      }

      var script = document.createElement('script')
      script.src = src
      script.defer = true
      script.setAttribute('data-pc-loading', 'true')
      script.addEventListener(
        'load',
        function () {
          script.setAttribute('data-pc-loaded', 'true')
          script.removeAttribute('data-pc-loading')
          resolve()
        },
        { once: true }
      )
      script.addEventListener(
        'error',
        function () {
          script.removeAttribute('data-pc-loading')
          reject(new Error('Failed to load ' + src))
        },
        { once: true }
      )
      document.head.appendChild(script)
    })
  }

  async function ensureAuthStackLoaded() {
    if (window.pcSync) {
      return true
    }

    await loadScriptOnce(SUPABASE_UMD_URL)
    await loadScriptOnce(SUPABASE_CONFIG_URL)
    await loadScriptOnce(SYNC_URL)
    return !!window.pcSync
  }

  function shouldHydrateAuthOnLoad() {
    return safeGet(AUTH_STATE_KEY) === 'signed_in'
  }

  function queueProgressSync() {
    if (
      !window.pcSync ||
      typeof window.pcSync.getCurrentUser !== 'function' ||
      typeof window.pcSync.syncToServer !== 'function'
    ) {
      return
    }

    var user = window.pcSync.getCurrentUser()
    if (!user) {
      return
    }

    window.pcSync
      .syncToServer({ trigger: 'practice_progress' })
      .catch(function () {
        // Keep local experience uninterrupted.
      })
  }

  function getTopicLabel(topic) {
    var normalized = String(topic || 'general')
      .replace(/[-_]+/g, ' ')
      .trim()
    if (!normalized) {
      return 'General'
    }
    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }

  function getQuestionCounter(index) {
    if (!questions.length) {
      return { current: 1, total: 1 }
    }

    var current = Math.min(Math.max(index + 1, 1), questions.length)
    return {
      current: current,
      total: questions.length,
    }
  }

  function setProgress(index) {
    var progress = byId('question-progress')
    var fill = byId('practice-progress-fill')
    var counter = getQuestionCounter(index)
    if (progress) {
      progress.textContent =
        'Question ' + counter.current + ' of ' + counter.total
    }
    if (fill) {
      fill.style.width = String((counter.current / counter.total) * 100) + '%'
    }
  }

  function isModalVisible(modal) {
    if (!modal) {
      return false
    }
    if (modal.hasAttribute('hidden')) {
      return false
    }
    return modal.style.display !== 'none'
  }

  function getFocusableElements(modal) {
    if (!modal) {
      return []
    }
    return Array.prototype.slice.call(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    )
  }

  function openModal(modal, source) {
    if (!modal) {
      return
    }

    modal.removeAttribute('hidden')
    modal.style.display = 'flex'
    modal.setAttribute('aria-hidden', 'false')

    var focusables = getFocusableElements(modal)
    if (focusables.length) {
      focusables[0].focus()
    }

    if (source) {
      trackEvent('paywall_viewed', { source: source })
    }
  }

  function closeModal(modal) {
    if (!modal) {
      return
    }
    modal.setAttribute('hidden', '')
    modal.style.display = 'none'
    modal.setAttribute('aria-hidden', 'true')
  }

  function bindModalFocusTrap(modal) {
    if (!modal || modal.dataset.pcTrapBound === 'true') {
      return
    }
    modal.dataset.pcTrapBound = 'true'

    modal.addEventListener('keydown', function (event) {
      if (!isModalVisible(modal)) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        closeModal(modal)
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      var focusables = getFocusableElements(modal)
      if (!focusables.length) {
        return
      }

      var first = focusables[0]
      var last = focusables[focusables.length - 1]
      var active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    })
  }

  function setupPracticeModals() {
    var gate = byId('gate-modal')
    var paymentGate = byId('payment-gate')
    var gateClose = byId('gate-close-btn')
    var gateDismiss = byId('gate-dismiss-btn')

    if (gate) {
      closeModal(gate)
      bindModalFocusTrap(gate)
    }

    if (paymentGate) {
      closeModal(paymentGate)
      bindModalFocusTrap(paymentGate)
    }

    if (gateClose) {
      gateClose.addEventListener('click', function () {
        closeModal(gate)
      })
    }

    if (gateDismiss) {
      gateDismiss.addEventListener('click', function () {
        closeModal(gate)
      })
    }

    if (gate) {
      gate.addEventListener('click', function (event) {
        if (event.target === gate) {
          closeModal(gate)
        }
      })
    }

    if (paymentGate) {
      paymentGate.addEventListener('click', function (event) {
        if (event.target === paymentGate) {
          closeModal(paymentGate)
        }
      })
    }

    window.pcPracticeModals = {
      openGate: function () {
        openModal(gate, 'free_limit_gate')
      },
      openPaymentGate: function () {
        openModal(paymentGate, 'payment_gate')
      },
      closeAll: function () {
        closeModal(gate)
        closeModal(paymentGate)
      },
    }
  }

  function parseQuestions(data) {
    if (!Array.isArray(data)) {
      return []
    }

    return data.filter(function (item) {
      if (
        !item ||
        typeof item !== 'object' ||
        !item.stem ||
        !item.options ||
        !item.correct
      ) {
        return false
      }

      var optionKeys = Object.keys(item.options)
      return (
        optionKeys.length >= 2 &&
        optionKeys.indexOf(String(item.correct)) !== -1
      )
    })
  }

  async function fetchQuestionBank(url) {
    var response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' on ' + url)
    }

    return response.json()
  }

  async function loadQuestionBankData() {
    return fetchQuestionBank(FREE_BANK_URL)
  }

  function renderList(items) {
    if (!Array.isArray(items) || !items.length) {
      return ''
    }

    var content = items
      .map(function (item) {
        return '<li>' + escapeHtml(item) + '</li>'
      })
      .join('')

    return '<ul class="pc-question-explanation-list">' + content + '</ul>'
  }

  function renderEliminationMap(question, selectedOption) {
    var map = question && question.eliminate_wrong
    if (!map || typeof map !== 'object') {
      return ''
    }

    var keys = Object.keys(map)
    if (!keys.length) {
      return ''
    }

    var highlighted = ''
    if (selectedOption && map[selectedOption]) {
      highlighted =
        '<p><strong>Your Option ' +
        escapeHtml(selectedOption) +
        ':</strong> ' +
        escapeHtml(map[selectedOption]) +
        '</p>'
    }

    var lines = keys
      .map(function (key) {
        return (
          '<li><strong>' +
          escapeHtml(key) +
          '.</strong> ' +
          escapeHtml(map[key]) +
          '</li>'
        )
      })
      .join('')

    return (
      '<h5>❌ Eliminate Wrong Answers</h5>' +
      highlighted +
      '<ul class="pc-question-explanation-list">' +
      lines +
      '</ul>'
    )
  }

  function renderExplanationHtml(question, selectedOption) {
    var parts = []

    if (question.decision_framework) {
      parts.push(
        '<h5>🧠 Decision Framework</h5><p>' +
          escapeHtml(question.decision_framework) +
          '</p>'
      )
    }

    if (Array.isArray(question.key_triggers) && question.key_triggers.length) {
      parts.push('<h5>Key Triggers</h5>' + renderList(question.key_triggers))
    }

    var eliminationHtml = renderEliminationMap(question, selectedOption)
    if (eliminationHtml) {
      parts.push(eliminationHtml)
    }

    if (question.explanation) {
      parts.push(
        '<h5>✅ Correct Answer Logic</h5><p>' +
          escapeHtml(question.explanation) +
          '</p>'
      )
    }

    if (question.speed_training) {
      parts.push(
        '<h5>⏱️ Speed Training</h5><p>' +
          escapeHtml(question.speed_training) +
          '</p>'
      )
    }

    if (question.navle_rule) {
      parts.push(
        '<p><strong>NAVLE Rule:</strong> ' +
          escapeHtml(question.navle_rule) +
          '</p>'
      )
    }

    if (question.source_doc) {
      parts.push(
        '<p class="pc-text-small">Source format: ' +
          escapeHtml(question.source_doc) +
          '</p>'
      )
    }

    if (!parts.length) {
      parts.push('<p>No explanation available for this question yet.</p>')
    }

    return parts.join('')
  }

  async function loadQuestions() {
    var container = byId('question-container')

    try {
      var data = await loadQuestionBankData()
      questions = parseQuestions(data)

      if (!questions.length) {
        throw new Error('No questions available')
      }

      var resumeIndex = readSessionIndex()
      if (resumeIndex >= questions.length) {
        resumeIndex = 0
      }

      showQuestion(resumeIndex)
      if (!practiceStartedTracked) {
        practiceStartedTracked = true
        trackEvent('practice_started', {
          topic: 'mixed_emergency',
          question_count: questions.length,
        })
      }
    } catch (error) {
      console.error('Failed to load questions:', error)
      if (container) {
        container.innerHTML =
          '<p class="pc-calculator-warning">Error loading questions. Please refresh.</p>'
      }
    }
  }

  function showQuestion(index) {
    var container = byId('question-container')
    if (!container) {
      return
    }

    if (index >= questions.length) {
      container.innerHTML = "<h3>You've completed all available questions!</h3>"
      writeSessionIndex(0)
      return
    }

    currentQuestion = questions[index]
    questionIndex = index
    writeSessionIndex(index)

    var optionsHtml = Object.entries(currentQuestion.options)
      .map(function (pair) {
        var key = pair[0]
        var text = pair[1]
        return (
          '' +
          '<button class="pc-option-btn" type="button" onclick="selectOption(\'' +
          key +
          '\')" data-option="' +
          key +
          '">' +
          '<span class="pc-option-key">' +
          escapeHtml(key) +
          '</span>' +
          '<span class="pc-option-text">' +
          escapeHtml(text) +
          '</span>' +
          '</button>'
        )
      })
      .join('')

    container.innerHTML =
      '' +
      '<div class="pc-question-card">' +
      '<div class="pc-question-header">' +
      '<span class="pc-question-number">Question ' +
      (index + 1) +
      '</span>' +
      '<span class="pc-question-topic">' +
      escapeHtml(getTopicLabel(currentQuestion.topic || 'general')) +
      '</span>' +
      '</div>' +
      '<p class="pc-question-stem">' +
      escapeHtml(currentQuestion.stem) +
      '</p>' +
      '<div class="pc-question-options">' +
      optionsHtml +
      '</div>' +
      '<div class="pc-question-feedback" id="feedback" style="display:none;"></div>' +
      '</div>'

    setProgress(index)
    rememberLearningLocation()
  }

  function selectOption(option) {
    if (!currentQuestion) {
      return
    }

    var buttons = document.querySelectorAll('.pc-option-btn')
    buttons.forEach(function (btn) {
      btn.disabled = true
      if (btn.dataset.option === currentQuestion.correct) {
        btn.classList.add('pc-option--correct')
      } else if (
        btn.dataset.option === option &&
        option !== currentQuestion.correct
      ) {
        btn.classList.add('pc-option--incorrect')
      }
    })

    var feedback = byId('feedback')
    if (!feedback) {
      return
    }

    var isCorrect = option === currentQuestion.correct
    trackEvent('practice_question_answered', {
      question_id: currentQuestion.id || 'unknown',
      topic: currentQuestion.topic || 'general',
      is_correct: isCorrect ? 'true' : 'false',
    })

    feedback.style.display = 'block'
    feedback.className =
      'pc-question-feedback ' +
      (isCorrect ? 'pc-feedback--correct' : 'pc-feedback--incorrect')
    feedback.innerHTML =
      '' +
      '<h4>' +
      (isCorrect ? '✓ Correct!' : '✗ Not the Best Choice') +
      '</h4>' +
      renderExplanationHtml(currentQuestion, option) +
      '<button class="pc-btn pc-btn--primary" type="button" onclick="nextQuestion()">Next Question</button>'

    writeSessionIndex(questionIndex + 1)
    queueProgressSync()
  }

  function nextQuestion() {
    var nextIndex = questionIndex + 1
    writeSessionIndex(nextIndex)
    showQuestion(nextIndex)
  }

  function isAdultDobValue(value) {
    if (!value) {
      return false
    }

    var dob = new Date(value + 'T00:00:00')
    if (Number.isNaN(dob.getTime())) {
      return false
    }

    var today = new Date()
    var age = today.getFullYear() - dob.getFullYear()
    var monthDiff = today.getMonth() - dob.getMonth()
    var dayDiff = today.getDate() - dob.getDate()

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1
    }

    return age >= 18
  }

  async function sendMagicLinkFromGate() {
    var emailInput = byId('gate-email')
    var dobInput = byId('gate-dob')
    var tosInput = byId('gate-consent-tos')
    var marketingInput = byId('gate-consent-marketing')
    var message = byId('gate-message')
    var submit = byId('gate-submit')

    var email = emailInput ? String(emailInput.value || '').trim() : ''
    var dobValue = dobInput ? String(dobInput.value || '').trim() : ''
    var tosAccepted = tosInput ? !!tosInput.checked : false
    var marketingAccepted = marketingInput ? !!marketingInput.checked : false
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (message) {
        message.textContent = 'Enter a valid email address.'
        message.classList.add('pc-is-error')
      }
      return
    }

    if (!isAdultDobValue(dobValue)) {
      if (message) {
        message.textContent = 'You must be at least 18 years old to continue.'
        message.classList.add('pc-is-error')
      }
      return
    }

    if (!tosAccepted) {
      if (message) {
        message.textContent =
          'You must agree to the Terms of Service to continue.'
        message.classList.add('pc-is-error')
      }
      return
    }

    if (submit) {
      submit.disabled = true
    }

    if (message) {
      message.textContent = 'Sending magic link...'
      message.classList.remove('pc-is-error')
      message.classList.remove('pc-is-success')
    }

    try {
      var authReady = await ensureAuthStackLoaded()
      if (
        authReady &&
        window.pcSync &&
        typeof window.pcSync.sendMagicLink === 'function'
      ) {
        var now = new Date().toISOString()
        var result = await window.pcSync.sendMagicLink(email, {
          redirectTo: window.location.origin + getCurrentPath(),
          metadata: {
            date_of_birth: dobValue,
            age_verified_18_plus: true,
            tos_consent: {
              text: 'I agree to the Terms of Service.',
              accepted: true,
              acceptedAt: now,
            },
            marketing_consent: {
              text: 'Yes, send me study tips and NAVLE updates.',
              accepted: marketingAccepted,
              acceptedAt: marketingAccepted ? now : '',
            },
          },
        })

        if (result && result.ok) {
          if (message) {
            message.textContent =
              'Magic link sent. Open it on any device to continue from synced progress.'
            message.classList.add('pc-is-success')
          }
        } else if (message) {
          message.textContent =
            'Could not send magic link right now. Please try again.'
          message.classList.add('pc-is-error')
        }
      } else if (message) {
        message.textContent =
          'Could not send magic link right now. Please try again.'
        message.classList.add('pc-is-error')
      }
    } catch (error) {
      if (message) {
        message.textContent =
          'Could not send magic link right now. Please try again.'
        message.classList.add('pc-is-error')
      }
    }

    if (submit) {
      submit.disabled = false
    }
  }

  function bindGateEvents() {
    var submit = byId('gate-submit')

    if (submit) {
      submit.addEventListener('click', function (event) {
        event.preventDefault()
        sendMagicLinkFromGate()
      })
    }
  }

  async function hydrateFromServerIfLoggedIn() {
    if (!shouldHydrateAuthOnLoad()) {
      return
    }

    var authReady = await ensureAuthStackLoaded()
    if (!authReady || !window.pcSync) {
      return
    }

    if (typeof window.pcSync.refreshCurrentUser === 'function') {
      await window.pcSync.refreshCurrentUser()
    }

    if (typeof window.pcSync.getCurrentUser !== 'function') {
      return
    }

    var user = window.pcSync.getCurrentUser()
    wasLoggedIn = !!user

    if (!user || typeof window.pcSync.syncFromServer !== 'function') {
      return
    }

    await window.pcSync.syncFromServer()
  }

  function bindAuthResume() {
    window.addEventListener('pc-auth-status-change', function (event) {
      var loggedIn = !!(event && event.detail && event.detail.loggedIn)
      if (!loggedIn || wasLoggedIn || authHydrationInFlight) {
        wasLoggedIn = loggedIn
        return
      }

      authHydrationInFlight = true
      wasLoggedIn = true

      Promise.resolve()
        .then(function () {
          return ensureAuthStackLoaded()
        })
        .then(function (ready) {
          if (
            ready &&
            window.pcSync &&
            typeof window.pcSync.syncFromServer === 'function'
          ) {
            return window.pcSync.syncFromServer()
          }
          return null
        })
        .then(function () {
          return loadQuestions()
        })
        .finally(function () {
          authHydrationInFlight = false
        })
    })
  }

  async function init() {
    if (!byId('question-container')) {
      return
    }

    setupPracticeModals()
    bindGateEvents()
    bindAuthResume()
    rememberLearningLocation()

    await hydrateFromServerIfLoggedIn()
    await loadQuestions()
  }

  window.selectOption = selectOption
  window.nextQuestion = nextQuestion

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      function () {
        init().catch(function () {
          // Keep page stable even if init fails.
        })
      },
      { once: true }
    )
  } else {
    init().catch(function () {
      // Keep page stable even if init fails.
    })
  }
})()
