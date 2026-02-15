;(function () {
  'use strict'

  function toNumber(value) {
    var parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : NaN
  }

  function format(value, digits, suffix) {
    if (!Number.isFinite(value)) {
      return '-'
    }
    return value.toFixed(digits) + (suffix || '')
  }

  function setText(id, text) {
    var node = document.getElementById(id)
    if (node) {
      node.textContent = text
    }
  }

  function getDoseBand(currentK) {
    if (currentK < 2.0) {
      return { low: 0.5, high: 0.5 }
    }
    if (currentK < 2.6) {
      return { low: 0.3, high: 0.4 }
    }
    if (currentK < 3.1) {
      return { low: 0.2, high: 0.25 }
    }
    if (currentK <= 3.5) {
      return { low: 0.1, high: 0.15 }
    }
    return { low: 0.05, high: 0.05 }
  }

  function render(event) {
    if (event) {
      event.preventDefault()
    }

    var weight = toNumber(document.getElementById('erp-weight').value)
    var currentK = toNumber(document.getElementById('erp-current-k').value)
    var targetK = toNumber(document.getElementById('erp-target-k').value)
    var fluidRate = toNumber(document.getElementById('erp-fluid-rate').value)

    if (
      !Number.isFinite(weight) ||
      weight <= 0 ||
      !Number.isFinite(currentK) ||
      !Number.isFinite(targetK) ||
      !Number.isFinite(fluidRate) ||
      fluidRate <= 0
    ) {
      setText(
        'erp-note',
        'Enter valid weight, potassium values, and fluid rate.'
      )
      return
    }

    var deficit = targetK - currentK
    if (deficit <= 0) {
      setText('erp-deficit', format(0, 2, ' mEq/L gap'))
      setText('erp-additive', '0 mEq/L (no active supplementation)')
      setText('erp-hourly', format(0, 2, ' mEq/hr delivered'))
      setText(
        'erp-note',
        'Current potassium is at or above the selected target. Recheck trend and avoid unnecessary potassium supplementation.'
      )
      return
    }

    var doseBand = getDoseBand(currentK)
    var midpointDose = (doseBand.low + doseBand.high) / 2
    var maxSafeDose = 0.5

    var effectiveLowDose = Math.min(doseBand.low, maxSafeDose)
    var effectiveHighDose = Math.min(doseBand.high, maxSafeDose)
    var suggestedDose = Math.min(midpointDose, maxSafeDose)
    var hourlyLoad = suggestedDose * weight
    var kclMlPerHour = hourlyLoad / 2
    var additiveLow = (effectiveLowDose * weight * 1000) / fluidRate
    var additiveHigh = (effectiveHighDose * weight * 1000) / fluidRate
    var suggestedAdditive = (suggestedDose * weight * 1000) / fluidRate
    var hourlyLabel =
      format(hourlyLoad, 2) +
      ' mEq/hr (~' +
      format(kclMlPerHour, 2) +
      ' mL/hr of 2 mEq/mL KCl)'

    setText('erp-deficit', format(deficit, 2, ' mEq/L gap'))
    setText(
      'erp-additive',
      format(additiveLow, 0, '') +
        '-' +
        format(additiveHigh, 0, ' mEq/L in fluids')
    )
    setText('erp-hourly', hourlyLabel)

    var note = 'Check serum potassium every 2-4 hours during active correction.'
    note +=
      ' Dose band target is ' +
      format(effectiveLowDose, 2, '') +
      '-' +
      format(effectiveHighDose, 2, ' mEq/kg/hr')
    note +=
      ' (AAHA-style K replacement ranges), with suggested additive around ' +
      format(suggestedAdditive, 0, ' mEq/L at this fluid rate.')
    if (additiveHigh > 80) {
      note +=
        ' This concentration may exceed typical peripheral-line comfort limits; central-line protocol may be needed.'
    }
    setText('erp-note', note)
  }

  function init() {
    var form = document.getElementById('erp-form')
    if (!form) {
      return
    }
    form.addEventListener('submit', render)
    form.addEventListener('input', render)
    form.addEventListener('change', render)
    render()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
