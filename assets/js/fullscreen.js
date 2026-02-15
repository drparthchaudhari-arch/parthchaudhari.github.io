;(function () {
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement)
  }

  function updateButtonState(button) {
    if (!button) {
      return
    }
    var active = isFullscreen()
    button.setAttribute('aria-pressed', String(active))
    button.textContent = active ? 'Exit Fullscreen' : 'Fullscreen'
  }

  function requestFull(element) {
    if (!element) {
      return
    }

    if (element.requestFullscreen) {
      element.requestFullscreen()
      return
    }

    if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    }
  }

  function exitFull() {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      return
    }

    if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }

  function initFullscreenButtons() {
    var buttons = document.querySelectorAll('[data-pc-fullscreen]')
    if (!buttons.length) {
      return
    }

    for (var i = 0; i < buttons.length; i += 1) {
      ;(function (button) {
        updateButtonState(button)
        button.addEventListener('click', function () {
          var targetSelector =
            button.getAttribute('data-pc-target') ||
            '[data-pc-fullscreen-target]'
          var target = document.querySelector(targetSelector)
          if (isFullscreen()) {
            exitFull()
          } else {
            requestFull(target || document.documentElement)
          }
        })
      })(buttons[i])
    }

    document.addEventListener('fullscreenchange', function () {
      for (var j = 0; j < buttons.length; j += 1) {
        updateButtonState(buttons[j])
      }
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFullscreenButtons, {
      once: true,
    })
  } else {
    initFullscreenButtons()
  }
})()
