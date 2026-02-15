;(function () {
  var STORAGE_KEY = 'pc_home_popup_closed'

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
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function closePopup(popup) {
    if (!popup) {
      return
    }
    popup.hidden = true
    safeSet(STORAGE_KEY, '1')
  }

  function initHomePopup() {
    var popup = document.querySelector('[data-pc-home-popup]')
    var closeButton = document.querySelector('[data-pc-popup-close]')

    if (!popup || !closeButton) {
      return
    }

    if (safeGet(STORAGE_KEY) === '1') {
      popup.hidden = true
      return
    }

    closeButton.addEventListener('click', function () {
      closePopup(popup)
    })

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closePopup(popup)
      }
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePopup, { once: true })
  } else {
    initHomePopup()
  }
})()
