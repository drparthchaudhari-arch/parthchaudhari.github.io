;(function () {
  'use strict'

  function getRows() {
    return document.querySelectorAll('[data-normal-row]')
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
  }

  function updateSummary(visible, total) {
    var summary = document.getElementById('normal-search-summary')
    if (!summary) {
      return
    }

    if (visible === total) {
      summary.textContent = 'Showing all values.'
      return
    }

    summary.textContent = 'Showing ' + visible + ' of ' + total + ' values.'
  }

  function filterRows(query) {
    var rows = getRows()
    var total = rows.length
    var visible = 0

    for (var i = 0; i < rows.length; i += 1) {
      var row = rows[i]
      var haystack = normalize(
        row.getAttribute('data-search') + ' ' + row.textContent
      )
      var matches = !query || haystack.indexOf(query) !== -1
      row.hidden = !matches
      if (matches) {
        visible += 1
      }
    }

    updateSummary(visible, total)
  }

  function init() {
    var input = document.getElementById('normal-search')
    if (!input) {
      return
    }

    input.addEventListener('input', function () {
      filterRows(normalize(input.value))
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
