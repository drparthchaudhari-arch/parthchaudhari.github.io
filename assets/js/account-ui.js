;(function () {
  'use strict'

  var DISPLAY_NAME_KEY = 'pc_profile_name'
  var LOGIN_RATE_LIMIT_KEY = 'pc_login_rate_limit_v1'
  var LOGIN_MAX_ATTEMPTS = 5
  var LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000
  var AGE_MIN_YEARS = 18
  var CONSENT_TERMS_TEXT = 'I agree to the Terms of Service.'
  var CONSENT_MARKETING_TEXT = 'Yes, send me study tips and NAVLE updates.'

  document.addEventListener('DOMContentLoaded', function () {
    initAccountUI()
  })

  function initAccountUI() {
    if (typeof window.pcSync === 'undefined') {
      console.error('Sync module not loaded')
      showError('Sync system unavailable. Please refresh.')
      return
    }

    var exportBtn = document.getElementById('pc-export-btn')
    var importBtn = document.getElementById('pc-import-btn')
    var importFile = document.getElementById('pc-import-file')
    var emailInput = document.getElementById('pc-email-input')
    var passwordInput = document.getElementById('pc-password-input')
    var loginBtn = document.getElementById('pc-login-btn')
    var signupBtn = document.getElementById('pc-signup-btn')
    var resetPasswordBtn = document.getElementById('pc-reset-password-btn')
    var setNewPasswordBtn = document.getElementById('pc-set-new-password-btn')
    var sendLinkBtn = document.getElementById('pc-send-link-btn')
    var syncBtn = document.getElementById('pc-sync-btn')
    var downloadBtn = document.getElementById('pc-download-data-btn')
    var deleteAccountBtn = document.getElementById('pc-delete-account-btn')
    var logoutBtn = document.getElementById('pc-logout-btn')
    var saveNameBtn = document.getElementById('pc-save-name-btn')

    updateLocalDataDisplay()
    hydrateDisplayNameInput()
    updateAuthUI()
    updateRecoveryUi()

    if (exportBtn) {
      exportBtn.addEventListener('click', handleExport)
    }

    if (importBtn && importFile) {
      importBtn.addEventListener('click', function () {
        importFile.click()
      })
      importFile.addEventListener('change', handleImport)
    }

    if (sendLinkBtn && emailInput) {
      sendLinkBtn.addEventListener('click', handleSendLink)
    }

    if (loginBtn && emailInput && passwordInput) {
      loginBtn.addEventListener('click', handlePasswordLogin)
    }

    if (signupBtn && emailInput && passwordInput) {
      signupBtn.addEventListener('click', handlePasswordSignup)
    }

    if (resetPasswordBtn && emailInput) {
      resetPasswordBtn.addEventListener('click', handlePasswordReset)
    }

    if (setNewPasswordBtn) {
      setNewPasswordBtn.addEventListener('click', handleSetNewPassword)
    }

    if (syncBtn) {
      syncBtn.addEventListener('click', handleSync)
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', handleExport)
    }

    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', handleDeleteAccount)
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout)
    }

    if (saveNameBtn) {
      saveNameBtn.addEventListener('click', handleSaveDisplayName)
    }

    window.addEventListener('pc-auth-status-change', updateAuthUI)
    window.addEventListener('pc-auth-changed', updateAuthUI)

    if (
      window.pcSync &&
      typeof window.pcSync.refreshCurrentUser === 'function'
    ) {
      window.pcSync.refreshCurrentUser().finally(updateAuthUI)
    }
  }

  function updateLocalDataDisplay() {
    var display = document.getElementById('pc-local-data')
    if (!display) {
      return
    }

    var completedCount = getCompletedCaseCount()
    var streak = getCurrentStreak()

    display.innerHTML = [
      '<div class="pc-account-metric" role="listitem">',
      '<p class="pc-account-metric__label">Cases Completed</p>',
      '<p class="pc-account-metric__value">' + completedCount + '</p>',
      '</div>',
      '<div class="pc-account-metric" role="listitem">',
      '<p class="pc-account-metric__label">Study Streak</p>',
      '<p class="pc-account-metric__value">' +
        streak +
        ' day' +
        (streak === 1 ? '' : 's') +
        '</p>',
      '</div>',
    ].join('')
  }

  function getCompletedCaseCount() {
    if (
      window.pcStorage &&
      typeof window.pcStorage.countCaseCompletions === 'function'
    ) {
      return window.pcStorage.countCaseCompletions()
    }

    var count = 0
    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i)
        if (
          key &&
          key.indexOf('pc_case_') === 0 &&
          localStorage.getItem(key) === 'completed'
        ) {
          count += 1
        }
      }
    } catch (error) {
      return 0
    }
    return count
  }

  function getCurrentStreak() {
    if (
      window.pcStorage &&
      typeof window.pcStorage.getCurrentStreak === 'function'
    ) {
      return window.pcStorage.getCurrentStreak()
    }

    try {
      var studyPlanRaw = localStorage.getItem('pc_study_plan') || '{}'
      var studyPlan = JSON.parse(studyPlanRaw)
      var streak = Number(studyPlan.currentStreak)
      return Number.isFinite(streak) && streak > 0 ? streak : 0
    } catch (error) {
      return 0
    }
  }

  function readStoredDisplayName() {
    try {
      return String(localStorage.getItem(DISPLAY_NAME_KEY) || '').trim()
    } catch (error) {
      return ''
    }
  }

  function writeStoredDisplayName(name) {
    try {
      var trimmed = String(name || '').trim()
      if (!trimmed) {
        localStorage.removeItem(DISPLAY_NAME_KEY)
        return true
      }
      localStorage.setItem(DISPLAY_NAME_KEY, trimmed)
      return true
    } catch (error) {
      return false
    }
  }

  function hydrateDisplayNameInput() {
    var input = document.getElementById('pc-display-name-input')
    if (!input) {
      return
    }

    input.value = readStoredDisplayName()
    updateDisplayNameNote('Saved locally on this device.')
  }

  function updateDisplayNameNote(message, isError) {
    var note = document.getElementById('pc-display-name-note')
    if (!note) {
      return
    }

    note.textContent = message || ''
    note.classList.remove('pc-is-error')
    note.classList.remove('pc-is-success')

    if (!message) {
      return
    }

    note.classList.add(isError ? 'pc-is-error' : 'pc-is-success')
  }

  function getCurrentUser() {
    if (!window.pcSync || typeof window.pcSync.getCurrentUser !== 'function') {
      return null
    }
    return window.pcSync.getCurrentUser()
  }

  function getDisplayNameForUser(user) {
    var localName = readStoredDisplayName()
    if (localName) {
      return localName
    }

    if (user && user.user_metadata) {
      var profileName =
        user.user_metadata.display_name ||
        user.user_metadata.full_name ||
        user.user_metadata.name
      if (profileName) {
        return String(profileName).trim()
      }
    }

    if (user && user.email) {
      return String(user.email).split('@')[0]
    }

    return 'Learner'
  }

  function updateAuthUI() {
    var user = getCurrentUser()
    var loggedInSection = document.getElementById('pc-logged-in-section')
    var loggedOutSection = document.getElementById('pc-logged-out-section')
    var statusDiv = document.getElementById('pc-account-status')
    var nameInput = document.getElementById('pc-display-name-input')

    if (nameInput && !nameInput.value) {
      nameInput.value = readStoredDisplayName()
    }

    if (user) {
      if (loggedInSection) {
        loggedInSection.hidden = false
      }
      if (loggedOutSection) {
        loggedOutSection.hidden = true
      }
      if (statusDiv) {
        var displayName = getDisplayNameForUser(user)
        statusDiv.innerHTML =
          '<p class="pc-status-success">Logged in as ' +
          escapeHtml(displayName) +
          '</p>'
      }

      var lastSync = getLastSyncTimestamp()
      var syncTimeDiv = document.getElementById('pc-last-sync')
      if (syncTimeDiv && lastSync) {
        syncTimeDiv.textContent =
          'Last synced: ' + new Date(lastSync).toLocaleString()
      }
      updateRecoveryUi()
      return
    }

    if (loggedInSection) {
      loggedInSection.hidden = true
    }
    if (loggedOutSection) {
      loggedOutSection.hidden = false
    }
    if (statusDiv) {
      statusDiv.innerHTML =
        '<p class="pc-status-info">Working in local mode. Log in with email/password (or magic link) to sync.</p>'
    }

    updateRecoveryUi()
  }

  function hasRecoveryTypeInHash() {
    var hash = String(window.location.hash || '')
    if (!hash) {
      return false
    }
    return hash.toLowerCase().indexOf('type=recovery') !== -1
  }

  function hasRecoveryTypeInQuery() {
    try {
      var params = new URLSearchParams(window.location.search || '')
      return String(params.get('type') || '').toLowerCase() === 'recovery'
    } catch (error) {
      return false
    }
  }

  function isRecoveryFlow() {
    return hasRecoveryTypeInHash() || hasRecoveryTypeInQuery()
  }

  function clearRecoveryFromUrl() {
    try {
      var url = new URL(window.location.href)
      url.hash = ''
      if (
        String(url.searchParams.get('type') || '').toLowerCase() === 'recovery'
      ) {
        url.searchParams.delete('type')
      }

      var next = url.pathname + (url.search ? url.search : '')
      window.history.replaceState({}, document.title, next)
    } catch (error) {
      // URL cleanup is best effort.
    }
  }

  function updateRecoveryUi() {
    var recoverySection = document.getElementById(
      'pc-password-recovery-section'
    )
    if (!recoverySection) {
      return
    }

    recoverySection.hidden = !isRecoveryFlow()
  }

  function getLastSyncTimestamp() {
    if (
      window.pcStorage &&
      typeof window.pcStorage.getLastSyncedAt === 'function'
    ) {
      return window.pcStorage.getLastSyncedAt() || ''
    }

    try {
      var meta = JSON.parse(localStorage.getItem('pc_sync_meta') || '{}')
      return meta.last_synced_at || localStorage.getItem('pc_last_sync') || ''
    } catch (error) {
      return localStorage.getItem('pc_last_sync') || ''
    }
  }

  function readLoginRateState() {
    try {
      return JSON.parse(localStorage.getItem(LOGIN_RATE_LIMIT_KEY) || '{}')
    } catch (error) {
      return {}
    }
  }

  function writeLoginRateState(nextState) {
    try {
      localStorage.setItem(
        LOGIN_RATE_LIMIT_KEY,
        JSON.stringify(nextState || {})
      )
      return true
    } catch (error) {
      return false
    }
  }

  function resetLoginAttempts() {
    writeLoginRateState({
      attempts: 0,
      firstAttemptAt: 0,
      lockedUntil: 0,
    })
  }

  function getLoginLockState() {
    var now = Date.now()
    var state = readLoginRateState()
    var attempts = Number(state.attempts) || 0
    var firstAttemptAt = Number(state.firstAttemptAt) || 0
    var lockedUntil = Number(state.lockedUntil) || 0

    if (lockedUntil && now >= lockedUntil) {
      resetLoginAttempts()
      return {
        locked: false,
        remainingMs: 0,
      }
    }

    return {
      locked: lockedUntil > now,
      remainingMs: lockedUntil > now ? lockedUntil - now : 0,
      attempts: attempts,
      firstAttemptAt: firstAttemptAt,
    }
  }

  function registerFailedLoginAttempt() {
    var now = Date.now()
    var state = readLoginRateState()
    var attempts = Number(state.attempts) || 0
    var firstAttemptAt = Number(state.firstAttemptAt) || 0

    if (!firstAttemptAt || now - firstAttemptAt > LOGIN_LOCK_WINDOW_MS) {
      attempts = 0
      firstAttemptAt = now
    }

    attempts += 1

    var nextState = {
      attempts: attempts,
      firstAttemptAt: firstAttemptAt,
      lockedUntil: 0,
    }

    if (attempts >= LOGIN_MAX_ATTEMPTS) {
      nextState.lockedUntil = now + LOGIN_LOCK_WINDOW_MS
    }

    writeLoginRateState(nextState)
    return nextState
  }

  function isAdultDob(value) {
    if (!value) {
      return false
    }

    var date = new Date(value + 'T00:00:00')
    if (Number.isNaN(date.getTime())) {
      return false
    }

    var today = new Date()
    var age = today.getFullYear() - date.getFullYear()
    var monthDiff = today.getMonth() - date.getMonth()
    var dayDiff = today.getDate() - date.getDate()

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1
    }

    return age >= AGE_MIN_YEARS
  }

  function validatePasswordComplexity(password) {
    var raw = String(password || '')
    if (raw.length < 8) {
      return {
        ok: false,
        message: 'Password must be at least 8 characters',
      }
    }

    if (!/[A-Z]/.test(raw) || !/[a-z]/.test(raw) || !/[0-9]/.test(raw)) {
      return {
        ok: false,
        message: 'Password must include uppercase, lowercase, and a number',
      }
    }

    return {
      ok: true,
      message: '',
    }
  }

  function buildConsentRecords(marketingOptIn) {
    var now = new Date().toISOString()
    return {
      terms: {
        text: CONSENT_TERMS_TEXT,
        accepted: true,
        acceptedAt: now,
        proof: {
          source: 'account_signup_form',
          ipAddress: 'captured-by-auth-provider',
        },
      },
      marketing: {
        text: CONSENT_MARKETING_TEXT,
        accepted: !!marketingOptIn,
        acceptedAt: marketingOptIn ? now : '',
        proof: {
          source: 'account_signup_form',
          ipAddress: 'captured-by-auth-provider',
        },
      },
    }
  }

  function writeLocalConsentAudit(consentRecords) {
    try {
      localStorage.setItem(
        'pc_consent_audit_v1',
        JSON.stringify(consentRecords || {})
      )
    } catch (error) {
      // Best effort storage.
    }
  }

  async function syncDisplayNameToProfile(displayName) {
    var user = getCurrentUser()
    if (!user || !displayName) {
      return { ok: false, skipped: true }
    }

    if (typeof window.getSupabaseClient !== 'function') {
      return { ok: false, skipped: true }
    }

    var client = window.getSupabaseClient()
    if (!client || typeof client.from !== 'function') {
      return { ok: false, skipped: true }
    }

    try {
      var response = await client.from('profiles').upsert(
        {
          id: user.id,
          email: user.email || user.id + '@local.invalid',
          display_name: displayName,
        },
        { onConflict: 'id' }
      )

      if (response.error) {
        throw response.error
      }

      if (client.auth && typeof client.auth.updateUser === 'function') {
        await client.auth.updateUser({
          data: {
            display_name: displayName,
            name: displayName,
          },
        })
      }

      return { ok: true }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  async function handleSaveDisplayName() {
    var nameInput = document.getElementById('pc-display-name-input')
    if (!nameInput) {
      return
    }

    var trimmed = String(nameInput.value || '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!trimmed) {
      writeStoredDisplayName('')
      updateDisplayNameNote(
        'Name cleared. You can continue in guest mode.',
        false
      )
      updateAuthUI()
      return
    }

    if (trimmed.length < 2) {
      updateDisplayNameNote('Name should be at least 2 characters.', true)
      return
    }

    if (!writeStoredDisplayName(trimmed)) {
      updateDisplayNameNote('Could not save name in this browser.', true)
      return
    }

    var user = getCurrentUser()
    if (user) {
      var syncResult = await syncDisplayNameToProfile(trimmed)
      if (syncResult.ok) {
        updateDisplayNameNote(
          'Name saved locally and synced to your profile.',
          false
        )
      } else {
        updateDisplayNameNote(
          'Name saved locally. Profile sync can be retried later.',
          true
        )
      }
    } else {
      updateDisplayNameNote(
        'Name saved locally. You can log in later to sync.',
        false
      )
    }

    updateAuthUI()
  }

  async function handleExport() {
    try {
      var data = await exportDataBundle()
      var blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download =
        'parth-portal-backup-' +
        new Date().toISOString().split('T')[0] +
        '.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccess('Data exported successfully')
    } catch (error) {
      showError('Export failed: ' + getErrorMessage(error))
    }
  }

  async function exportDataBundle() {
    if (window.pcSync && typeof window.pcSync.exportAllData === 'function') {
      return window.pcSync.exportAllData()
    }

    if (
      window.pcStorage &&
      typeof window.pcStorage.exportDataBundle === 'function'
    ) {
      return window.pcStorage.exportDataBundle()
    }

    var fallback = {}
    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i)
        if (key && key.indexOf('pc_') === 0) {
          fallback[key] = localStorage.getItem(key)
        }
      }
    } catch (error) {
      // Keep local fallback best-effort.
    }
    return fallback
  }

  async function handleImport(event) {
    var file =
      event && event.target && event.target.files ? event.target.files[0] : null
    if (!file) {
      return
    }

    try {
      var text = await file.text()
      var data = JSON.parse(text)

      if (
        window.confirm(
          'This will merge imported data with existing data. Continue?'
        )
      ) {
        await importDataBundle(text, data)
        showSuccess('Data imported successfully')
        updateLocalDataDisplay()
        updateAuthUI()
      }
    } catch (error) {
      showError('Import failed: ' + getErrorMessage(error))
    } finally {
      if (event && event.target) {
        event.target.value = ''
      }
    }
  }

  async function importDataBundle(rawText, parsedData) {
    if (window.pcSync && typeof window.pcSync.importAllData === 'function') {
      window.pcSync.importAllData(rawText)
      return
    }

    if (
      window.pcStorage &&
      typeof window.pcStorage.importDataBundle === 'function'
    ) {
      window.pcStorage.importDataBundle(parsedData)
      return
    }

    if (parsedData && typeof parsedData === 'object') {
      Object.keys(parsedData).forEach(function (key) {
        try {
          localStorage.setItem(key, String(parsedData[key]))
        } catch (error) {
          // Keep merge best-effort.
        }
      })
    }
  }

  async function handleSendLink() {
    var emailInput = document.getElementById('pc-email-input')
    var dobInput = document.getElementById('pc-dob-input')
    var tosCheckbox = document.getElementById('pc-consent-tos')
    var marketingCheckbox = document.getElementById('pc-consent-marketing')
    var email = emailInput ? String(emailInput.value || '').trim() : ''
    var dobValue = dobInput ? String(dobInput.value || '').trim() : ''
    var tosAccepted = tosCheckbox ? !!tosCheckbox.checked : false
    var marketingAccepted = marketingCheckbox
      ? !!marketingCheckbox.checked
      : false
    var preferredName = readStoredDisplayName()

    if (!email || email.indexOf('@') === -1) {
      showError('Please enter a valid email address')
      return
    }

    if (!isAdultDob(dobValue)) {
      showError('You must be at least 18 years old to continue.')
      return
    }

    if (!tosAccepted) {
      showError('You must agree to the Terms of Service to continue.')
      return
    }

    if (!window.pcSync || typeof window.pcSync.sendMagicLink !== 'function') {
      showError('Magic link is unavailable right now')
      return
    }

    try {
      var options = {}
      var consentRecords = buildConsentRecords(marketingAccepted)
      writeLocalConsentAudit(consentRecords)
      if (preferredName) {
        options.metadata = {
          display_name: preferredName,
          name: preferredName,
        }
      } else {
        options.metadata = {}
      }
      options.metadata.date_of_birth = dobValue
      options.metadata.age_verified_18_plus = true
      options.metadata.tos_consent = consentRecords.terms
      options.metadata.marketing_consent = consentRecords.marketing

      var result = await window.pcSync.sendMagicLink(email, options)
      if (isSuccessResult(result)) {
        showSuccess('Magic link sent. Check your email.')
        emailInput.value = ''
      } else {
        showError(
          'Failed to send link: ' + getErrorMessage(result && result.error)
        )
      }
    } catch (error) {
      showError('Error: ' + getErrorMessage(error))
    }
  }

  async function handlePasswordLogin() {
    var emailInput = document.getElementById('pc-email-input')
    var passwordInput = document.getElementById('pc-password-input')
    var email = emailInput ? String(emailInput.value || '').trim() : ''
    var password = passwordInput ? String(passwordInput.value || '') : ''

    if (!email || email.indexOf('@') === -1) {
      showError('Please enter a valid email address')
      return
    }

    if (!password) {
      showError('Please enter your password')
      return
    }

    if (
      !window.pcSync ||
      typeof window.pcSync.signInWithPassword !== 'function'
    ) {
      showError('Password login is unavailable right now')
      return
    }

    var lockState = getLoginLockState()
    if (lockState.locked) {
      var remainingMinutes = Math.ceil(lockState.remainingMs / 60000)
      showError(
        'Too many login attempts. Try again in ' +
          remainingMinutes +
          ' minute(s).'
      )
      return
    }

    try {
      var result = await window.pcSync.signInWithPassword(email, password)
      if (isSuccessResult(result)) {
        showSuccess('Logged in successfully')
        resetLoginAttempts()
        if (passwordInput) {
          passwordInput.value = ''
        }
        updateAuthUI()
        return
      }
      var failedState = registerFailedLoginAttempt()
      if (Number(failedState.lockedUntil) > Date.now()) {
        showError(
          'Too many failed attempts. Login is temporarily locked for 15 minutes.'
        )
        return
      }
      showError('Login failed: ' + getErrorMessage(result && result.error))
    } catch (error) {
      var failedStateFromCatch = registerFailedLoginAttempt()
      if (Number(failedStateFromCatch.lockedUntil) > Date.now()) {
        showError(
          'Too many failed attempts. Login is temporarily locked for 15 minutes.'
        )
        return
      }
      showError('Login failed: ' + getErrorMessage(error))
    }
  }

  async function handlePasswordSignup() {
    var emailInput = document.getElementById('pc-email-input')
    var passwordInput = document.getElementById('pc-password-input')
    var dobInput = document.getElementById('pc-dob-input')
    var tosCheckbox = document.getElementById('pc-consent-tos')
    var marketingCheckbox = document.getElementById('pc-consent-marketing')
    var email = emailInput ? String(emailInput.value || '').trim() : ''
    var password = passwordInput ? String(passwordInput.value || '') : ''
    var dobValue = dobInput ? String(dobInput.value || '').trim() : ''
    var tosAccepted = tosCheckbox ? !!tosCheckbox.checked : false
    var marketingAccepted = marketingCheckbox
      ? !!marketingCheckbox.checked
      : false
    var preferredName = readStoredDisplayName()

    if (!email || email.indexOf('@') === -1) {
      showError('Please enter a valid email address')
      return
    }

    if (!isAdultDob(dobValue)) {
      showError('You must be at least 18 years old to create an account.')
      return
    }

    if (!tosAccepted) {
      showError('You must agree to the Terms of Service to create an account.')
      return
    }

    var passwordCheck = validatePasswordComplexity(password)
    if (!passwordCheck.ok) {
      showError(passwordCheck.message)
      return
    }

    if (
      !window.pcSync ||
      typeof window.pcSync.signUpWithPassword !== 'function'
    ) {
      showError('Account creation is unavailable right now')
      return
    }

    try {
      var options = {}
      var consentRecords = buildConsentRecords(marketingAccepted)
      writeLocalConsentAudit(consentRecords)

      options.metadata = {
        date_of_birth: dobValue,
        age_verified_18_plus: true,
        tos_consent: consentRecords.terms,
        marketing_consent: consentRecords.marketing,
      }
      if (preferredName) {
        options.displayName = preferredName
        options.metadata.display_name = preferredName
        options.metadata.name = preferredName
      }

      var result = await window.pcSync.signUpWithPassword(
        email,
        password,
        options
      )
      if (!isSuccessResult(result)) {
        showError(
          'Account creation failed: ' + getErrorMessage(result && result.error)
        )
        return
      }

      if (result.requiresEmailConfirmation) {
        showSuccess(
          'Account created. Check your email to confirm before first login.'
        )
      } else {
        showSuccess('Account created and logged in.')
      }

      if (passwordInput) {
        passwordInput.value = ''
      }
      if (
        window.pcSync &&
        typeof window.pcSync.recordConsentAudit === 'function'
      ) {
        window.pcSync.recordConsentAudit(consentRecords).catch(function () {
          // Consent sync is best effort after sign up.
        })
      }
      updateAuthUI()
    } catch (error) {
      showError('Account creation failed: ' + getErrorMessage(error))
    }
  }

  async function handlePasswordReset() {
    var emailInput = document.getElementById('pc-email-input')
    var email = emailInput ? String(emailInput.value || '').trim() : ''

    if (!email || email.indexOf('@') === -1) {
      showError('Enter your account email first')
      return
    }

    if (
      !window.pcSync ||
      typeof window.pcSync.sendPasswordReset !== 'function'
    ) {
      showError('Password reset is unavailable right now')
      return
    }

    try {
      var result = await window.pcSync.sendPasswordReset(email)
      if (isSuccessResult(result)) {
        showSuccess('Password reset email sent. Check your inbox.')
      } else {
        showError(
          'Password reset failed: ' + getErrorMessage(result && result.error)
        )
      }
    } catch (error) {
      showError('Password reset failed: ' + getErrorMessage(error))
    }
  }

  async function handleSetNewPassword() {
    var passwordInput = document.getElementById('pc-new-password-input')
    var password = passwordInput ? String(passwordInput.value || '') : ''

    var passwordCheck = validatePasswordComplexity(password)
    if (!passwordCheck.ok) {
      showError(passwordCheck.message)
      return
    }

    if (!window.pcSync || typeof window.pcSync.updatePassword !== 'function') {
      showError('Password update is unavailable right now')
      return
    }

    try {
      var result = await window.pcSync.updatePassword(password)
      if (!isSuccessResult(result)) {
        showError(
          'Password update failed: ' + getErrorMessage(result && result.error)
        )
        return
      }

      if (passwordInput) {
        passwordInput.value = ''
      }
      clearRecoveryFromUrl()
      updateRecoveryUi()
      showSuccess(
        'Password updated successfully. You can continue with this account.'
      )
      updateAuthUI()
    } catch (error) {
      showError('Password update failed: ' + getErrorMessage(error))
    }
  }

  async function handleSync() {
    if (!window.pcSync || typeof window.pcSync.syncToServer !== 'function') {
      showError('Sync is unavailable right now')
      return
    }

    try {
      showStatus('Syncing...')
      if (typeof window.pcSync.syncFromServer === 'function') {
        await window.pcSync.syncFromServer()
      }

      var result = await window.pcSync.syncToServer({ trigger: 'manual_sync' })
      if (isSuccessResult(result)) {
        try {
          localStorage.setItem(
            'pc_last_sync',
            result.syncedAt || new Date().toISOString()
          )
        } catch (error) {
          // Ignore storage failures.
        }
        if (
          result &&
          Array.isArray(result.warnings) &&
          result.warnings.length
        ) {
          showStatus(
            'Sync complete with warnings: ' + result.warnings.join(' '),
            'info'
          )
        } else {
          showSuccess('Sync complete')
        }
        updateLocalDataDisplay()
        updateAuthUI()
      } else {
        if (isProfilesRlsError(result && result.error)) {
          showError(
            'Sync blocked by Supabase RLS on profiles. Add a profiles INSERT policy (auth.uid() = id) and retry.'
          )
          return
        }
        if (isUserProgressForeignKeyError(result && result.error)) {
          showError(
            'Sync blocked: user_progress requires a matching profiles row for your user. Create/fix profile row and retry sync.'
          )
          return
        }
        showError('Sync failed: ' + getErrorMessage(result && result.error))
      }
    } catch (error) {
      if (isProfilesRlsError(error)) {
        showError(
          'Sync blocked by Supabase RLS on profiles. Add a profiles INSERT policy (auth.uid() = id) and retry.'
        )
        return
      }
      if (isUserProgressForeignKeyError(error)) {
        showError(
          'Sync blocked: user_progress requires a matching profiles row for your user. Create/fix profile row and retry sync.'
        )
        return
      }
      showError('Sync error: ' + getErrorMessage(error))
    }
  }

  function clearAllLocalData() {
    if (
      window.pcStorage &&
      typeof window.pcStorage.clearAllData === 'function'
    ) {
      return window.pcStorage.clearAllData()
    }

    var removed = 0
    var keysToDelete = []
    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i)
        if (key && key.indexOf('pc_') === 0) {
          keysToDelete.push(key)
        }
      }

      for (var j = 0; j < keysToDelete.length; j += 1) {
        localStorage.removeItem(keysToDelete[j])
        removed += 1
      }
    } catch (error) {
      // Best effort local wipe.
    }
    return removed
  }

  async function handleDeleteAccount() {
    if (!window.pcSync || typeof window.pcSync.deleteAccount !== 'function') {
      showError('Delete account is unavailable right now')
      return
    }

    var confirmed = window.confirm(
      'Delete account permanently? This removes synced profile and progress data.'
    )
    if (!confirmed) {
      return
    }

    try {
      showStatus('Deleting account...', 'info')
      var result = await window.pcSync.deleteAccount()
      if (!isSuccessResult(result)) {
        showError(
          'Delete account failed: ' + getErrorMessage(result && result.error)
        )
        return
      }

      clearAllLocalData()
      resetLoginAttempts()
      showSuccess('Account deleted and local data cleared.')
      updateLocalDataDisplay()
      updateAuthUI()
    } catch (error) {
      showError('Delete account failed: ' + getErrorMessage(error))
    }
  }

  async function handleLogout() {
    if (!window.pcSync || typeof window.pcSync.signOut !== 'function') {
      showError('Logout is unavailable right now')
      return
    }

    try {
      var result = await window.pcSync.signOut()
      if (isSuccessResult(result)) {
        showSuccess('Logged out successfully')
        updateAuthUI()
      } else {
        showError('Logout failed: ' + getErrorMessage(result && result.error))
      }
    } catch (error) {
      showError('Logout failed: ' + getErrorMessage(error))
    }
  }

  function isSuccessResult(result) {
    return !!(result && (result.success === true || result.ok === true))
  }

  function isProfilesRlsError(error) {
    var message = getErrorMessage(error).toLowerCase()
    return (
      message.indexOf('row-level security') !== -1 &&
      message.indexOf('profiles') !== -1
    )
  }

  function isUserProgressForeignKeyError(error) {
    if (!error) {
      return false
    }

    var code = (error.code ? String(error.code) : '').toLowerCase()
    var message = getErrorMessage(error).toLowerCase()

    if (message.indexOf('user_progress_user_id_fkey') !== -1) {
      return true
    }

    if (code === '23503' && message.indexOf('user_progress') !== -1) {
      return true
    }

    return (
      message.indexOf('foreign key') !== -1 &&
      message.indexOf('user_progress') !== -1 &&
      message.indexOf('profiles') !== -1
    )
  }

  function getErrorMessage(error) {
    if (!error) {
      return 'Unknown error'
    }
    if (typeof error === 'string') {
      return error
    }
    if (error.message) {
      return String(error.message)
    }
    return String(error)
  }

  function showSuccess(message) {
    showStatus(message, 'success')
  }

  function showError(message) {
    showStatus(message, 'error')
  }

  function showStatus(message, type) {
    var statusDiv = document.getElementById('pc-account-status')
    if (!statusDiv) {
      return
    }

    var kind = type || 'info'
    statusDiv.innerHTML =
      '<p class="pc-status-' + kind + '">' + escapeHtml(message) + '</p>'

    setTimeout(function () {
      if (
        statusDiv.textContent &&
        statusDiv.textContent.indexOf(message) !== -1
      ) {
        statusDiv.innerHTML = ''
      }
    }, 5000)
  }

  function escapeHtml(text) {
    var div = document.createElement('div')
    div.textContent = String(text || '')
    return div.innerHTML
  }
})()
