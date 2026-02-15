;(function () {
  var MODE_KEY = 'siteMode'
  var THEME_KEY = 'siteTheme'
  var VALID_MODES = ['pro', 'play']
  var VALID_THEMES = ['light', 'dark']

  function readSetting(key, fallback, validValues) {
    try {
      var value = localStorage.getItem(key)
      if (validValues.indexOf(value) !== -1) {
        return value
      }
    } catch (error) {
      // localStorage may be unavailable in restricted contexts.
    }
    return fallback
  }

  var currentMode = readSetting(MODE_KEY, 'pro', VALID_MODES)
  var currentTheme = readSetting(THEME_KEY, 'light', VALID_THEMES)

  function writeSetting(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      // Persisting is optional; continue with in-memory values.
    }
  }

  function modeLabel(value) {
    return value === 'play' ? 'Mode: Gaming' : 'Mode: Professional'
  }

  function modeTargetLabel(value) {
    return value === 'play' ? 'Professional' : 'Gaming'
  }

  function themeLabel(value) {
    return value === 'dark' ? 'Theme: Night' : 'Theme: Day'
  }

  function themeTargetLabel(value) {
    return value === 'dark' ? 'Day' : 'Night'
  }

  function themeIcon(value) {
    return value === 'dark' ? '&#9790;' : '&#9728;'
  }

  function ensureThemeIconNode(button) {
    var icon = button.querySelector('[data-pc-theme-icon]')
    if (icon) {
      return icon
    }

    icon = document.createElement('span')
    icon.className = 'pc-nav-toggle__icon'
    icon.setAttribute('data-pc-theme-icon', '')
    icon.setAttribute('aria-hidden', 'true')
    button.insertBefore(icon, button.firstChild)
    return icon
  }

  function ensureThemeLabelNode(button) {
    var label = button.querySelector('[data-pc-theme-label]')
    if (label) {
      return label
    }

    label = document.createElement('span')
    label.setAttribute('data-pc-theme-label', '')
    label.className = 'pc-nav-toggle__label'
    button.appendChild(label)
    return label
  }

  function applySettings() {
    var root = document.documentElement
    root.setAttribute('data-mode', currentMode)
    root.setAttribute('data-theme', currentTheme)

    if (document.body) {
      document.body.setAttribute('data-mode', currentMode)
      document.body.setAttribute('data-theme', currentTheme)
    }

    var modeButtons = document.querySelectorAll('[data-pc-mode-toggle]')
    for (var i = 0; i < modeButtons.length; i += 1) {
      var modeButton = modeButtons[i]
      modeButton.classList.add('pc-nav-toggle--mode')
      modeButton.setAttribute('aria-pressed', String(currentMode === 'play'))
      modeButton.setAttribute(
        'aria-label',
        'Switch to ' + modeTargetLabel(currentMode) + ' mode'
      )
      modeButton.setAttribute(
        'title',
        'Switch to ' + modeTargetLabel(currentMode) + ' mode'
      )
    }

    var modeLabels = document.querySelectorAll('[data-pc-mode-label]')
    for (var j = 0; j < modeLabels.length; j += 1) {
      modeLabels[j].textContent = modeLabel(currentMode)
    }

    var themeButtons = document.querySelectorAll('[data-pc-theme-toggle]')
    for (var k = 0; k < themeButtons.length; k += 1) {
      var themeButton = themeButtons[k]
      themeButton.classList.add('pc-nav-toggle--theme')
      themeButton.setAttribute('aria-pressed', String(currentTheme === 'dark'))
      themeButton.setAttribute(
        'aria-label',
        'Switch to ' + themeTargetLabel(currentTheme) + ' theme'
      )
      themeButton.setAttribute(
        'title',
        'Switch to ' + themeTargetLabel(currentTheme) + ' theme'
      )

      for (var t = themeButton.childNodes.length - 1; t >= 0; t -= 1) {
        if (themeButton.childNodes[t].nodeType === 3) {
          themeButton.removeChild(themeButton.childNodes[t])
        }
      }

      var icon = ensureThemeIconNode(themeButton)
      icon.innerHTML = themeIcon(currentTheme)

      var labelNode = ensureThemeLabelNode(themeButton)
      labelNode.textContent = themeLabel(currentTheme)
      labelNode.classList.add('pc-nav-toggle__label--visually-hidden')
    }
  }

  function toggleMode() {
    currentMode = currentMode === 'pro' ? 'play' : 'pro'
    writeSetting(MODE_KEY, currentMode)
    applySettings()
  }

  function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light'
    writeSetting(THEME_KEY, currentTheme)
    applySettings()
  }

  function bindButtons() {
    var modeButtons = document.querySelectorAll('[data-pc-mode-toggle]')
    for (var i = 0; i < modeButtons.length; i += 1) {
      if (modeButtons[i].dataset.pcToggleBound === 'true') {
        continue
      }
      modeButtons[i].dataset.pcToggleBound = 'true'
      modeButtons[i].addEventListener('click', toggleMode)
    }

    var themeButtons = document.querySelectorAll('[data-pc-theme-toggle]')
    for (var j = 0; j < themeButtons.length; j += 1) {
      if (themeButtons[j].dataset.pcToggleBound === 'true') {
        continue
      }
      themeButtons[j].dataset.pcToggleBound = 'true'
      themeButtons[j].addEventListener('click', toggleTheme)
    }
  }

  function init() {
    bindButtons()
    applySettings()
  }

  applySettings()

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }

  window.addEventListener('storage', function (event) {
    if (event.key === MODE_KEY && VALID_MODES.indexOf(event.newValue) !== -1) {
      currentMode = event.newValue
      applySettings()
    }
    if (
      event.key === THEME_KEY &&
      VALID_THEMES.indexOf(event.newValue) !== -1
    ) {
      currentTheme = event.newValue
      applySettings()
    }
  })
})()
