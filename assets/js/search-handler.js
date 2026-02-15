;(function () {
  function initSearch() {
    if (window.pcSearch && typeof window.pcSearch.init === 'function') {
      window.pcSearch.init()
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch, { once: true })
  } else {
    initSearch()
  }
})()
