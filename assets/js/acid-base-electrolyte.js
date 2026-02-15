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

  function setText(id, value) {
    var node = document.getElementById(id)
    if (node) {
      node.textContent = value
    }
  }

  function setAlert(message, level) {
    var node = document.getElementById('ab-alert')
    if (!node) {
      return
    }

    if (!message) {
      node.hidden = true
      node.textContent = ''
      node.className = 'pc-calculator-warning'
      return
    }

    node.hidden = false
    node.textContent = message
    node.className = 'pc-calculator-warning'
    if (level === 'danger') {
      node.classList.add('pc-calculator-warning--danger')
    } else if (level === 'caution') {
      node.classList.add('pc-calculator-warning--caution')
    }
  }

  function getPrimaryDisorder(pH, pCO2, hco3) {
    if (
      !Number.isFinite(pH) ||
      !Number.isFinite(pCO2) ||
      !Number.isFinite(hco3)
    ) {
      return 'Insufficient data'
    }

    if (pH < 7.35) {
      if (pCO2 > 45 && hco3 < 22) {
        return 'Mixed Respiratory + Metabolic Acidosis'
      }
      if (pCO2 > 45) {
        return 'Primary Respiratory Acidosis'
      }
      if (hco3 < 22) {
        return 'Primary Metabolic Acidosis'
      }
      return 'Acidemia (unclear primary)'
    }

    if (pH > 7.45) {
      if (pCO2 < 35 && hco3 > 26) {
        return 'Mixed Respiratory + Metabolic Alkalosis'
      }
      if (pCO2 < 35) {
        return 'Primary Respiratory Alkalosis'
      }
      if (hco3 > 26) {
        return 'Primary Metabolic Alkalosis'
      }
      return 'Alkalemia (unclear primary)'
    }

    if (pCO2 > 45 && hco3 > 26) {
      return 'Compensated Respiratory Acidosis'
    }
    if (pCO2 < 35 && hco3 < 22) {
      return 'Compensated Respiratory Alkalosis'
    }

    return 'Near-normal pH'
  }

  function compensationInterpretation(primary, pCO2, hco3) {
    if (!Number.isFinite(pCO2) || !Number.isFinite(hco3)) {
      return 'Need pCO2 and HCO3 for compensation check.'
    }

    if (primary.indexOf('Metabolic Acidosis') !== -1) {
      var expected = 1.5 * hco3 + 8
      var low = expected - 2
      var high = expected + 2
      if (pCO2 < low) {
        return (
          'Expected pCO2 ' +
          format(expected, 1) +
          ' (Winter). Actual lower than expected: concurrent respiratory alkalosis possible.'
        )
      }
      if (pCO2 > high) {
        return (
          'Expected pCO2 ' +
          format(expected, 1) +
          ' (Winter). Actual higher than expected: concurrent respiratory acidosis possible.'
        )
      }
      return 'Compensation appears appropriate (Winter formula).'
    }

    if (primary.indexOf('Metabolic Alkalosis') !== -1) {
      var expectedAlk = 40 + 0.7 * (hco3 - 24)
      var capped = Math.min(expectedAlk, 55)
      return (
        'Expected pCO2 about ' +
        format(capped, 1) +
        ' for metabolic alkalosis compensation.'
      )
    }

    if (primary.indexOf('Respiratory Acidosis') !== -1) {
      var deltaCO2 = Math.max(0, pCO2 - 40)
      var acute = 24 + deltaCO2 / 10
      var chronic = 24 + deltaCO2 * 0.35
      return (
        'Expected HCO3: acute ' +
        format(acute, 1) +
        ', chronic ' +
        format(chronic, 1) +
        ' mEq/L.'
      )
    }

    if (primary.indexOf('Respiratory Alkalosis') !== -1) {
      var deltaDrop = Math.max(0, 40 - pCO2)
      var acuteAlk = 24 - (deltaDrop / 10) * 2
      var chronicAlk = 24 - (deltaDrop / 10) * 4
      return (
        'Expected HCO3: acute ' +
        format(acuteAlk, 1) +
        ', chronic ' +
        format(chronicAlk, 1) +
        ' mEq/L.'
      )
    }

    return 'Compensation check not applicable with current pattern.'
  }

  function deltaRatioInterpretation(delta) {
    if (!Number.isFinite(delta)) {
      return 'Delta ratio unavailable.'
    }
    if (delta < 0.4) {
      return 'Pattern suggests normal anion gap acidosis or mixed NAGMA + HAGMA.'
    }
    if (delta < 0.8) {
      return 'Likely mixed high + normal anion gap acidosis.'
    }
    if (delta <= 1.2) {
      return 'Compatible with isolated high anion gap acidosis.'
    }
    if (delta <= 2) {
      return 'Possible high anion gap acidosis with metabolic alkalosis.'
    }
    return 'High delta ratio: concurrent metabolic alkalosis or chronic respiratory acidosis may coexist.'
  }

  function buildDifferentials(primary, correctedAG) {
    if (primary.indexOf('Metabolic Acidosis') !== -1) {
      if (Number.isFinite(correctedAG) && correctedAG >= 20) {
        return 'High AG acidosis differentials: lactate, ketoacids, uremia, toxins (ethylene glycol/salicylates).'
      }
      return 'Normal AG acidosis differentials: GI bicarbonate loss, renal tubular acidosis, hypoadrenocorticism.'
    }

    if (primary.indexOf('Metabolic Alkalosis') !== -1) {
      return 'Metabolic alkalosis differentials: vomiting/upper GI loss, diuretics, chloride depletion, hypokalemia.'
    }

    if (primary.indexOf('Respiratory Acidosis') !== -1) {
      return 'Respiratory acidosis differentials: hypoventilation, airway disease, severe CNS depression, pleural disease.'
    }

    if (primary.indexOf('Respiratory Alkalosis') !== -1) {
      return 'Respiratory alkalosis differentials: hyperventilation due to pain, sepsis, hypoxemia, anxiety.'
    }

    return 'Integrate lactate, electrolytes, and perfusion parameters for a complete interpretation.'
  }

  function calculate(event) {
    event.preventDefault()

    var species = String(
      document.getElementById('ab-species').value || 'canine'
    )
    var pH = toNumber(document.getElementById('ab-ph').value)
    var pCO2 = toNumber(document.getElementById('ab-pco2').value)
    var hco3 = toNumber(document.getElementById('ab-hco3').value)
    var na = toNumber(document.getElementById('ab-na').value)
    var cl = toNumber(document.getElementById('ab-cl').value)
    var albumin = toNumber(document.getElementById('ab-albumin').value)
    var glucose = toNumber(document.getElementById('ab-glucose').value)
    var bun = toNumber(document.getElementById('ab-bun').value)
    var ca = toNumber(document.getElementById('ab-ca').value)

    var alertMessage = ''
    var alertLevel = ''

    if (Number.isFinite(pH) && (pH < 6.8 || pH > 7.8)) {
      alertMessage =
        'Input pH appears outside physiologic range. Recheck analyzer values.'
      alertLevel = 'danger'
    }

    var primary = getPrimaryDisorder(pH, pCO2, hco3)

    var anionGap =
      Number.isFinite(na) && Number.isFinite(cl) && Number.isFinite(hco3)
        ? na - (cl + hco3)
        : NaN

    var normalAlbumin = species === 'feline' ? 2.8 : 3.3
    var correctedAG =
      Number.isFinite(anionGap) && Number.isFinite(albumin)
        ? anionGap + 2.5 * (normalAlbumin - albumin)
        : NaN

    var deltaRatio =
      Number.isFinite(correctedAG) && Number.isFinite(hco3) && 24 - hco3 > 0
        ? (correctedAG - 12) / (24 - hco3)
        : NaN

    var baseExcess =
      Number.isFinite(pH) && Number.isFinite(hco3)
        ? 0.9287 * (hco3 - 24.4 + 14.83 * (pH - 7.4))
        : NaN

    var correctedNa =
      Number.isFinite(na) && Number.isFinite(glucose)
        ? na + Math.max(0, ((glucose - 100) / 100) * 1.6)
        : NaN

    var correctedCa =
      Number.isFinite(ca) && Number.isFinite(albumin)
        ? ca + 0.8 * (3.5 - albumin)
        : NaN

    var osmolality =
      Number.isFinite(na) && Number.isFinite(glucose) && Number.isFinite(bun)
        ? 2 * na + glucose / 18 + bun / 2.8
        : NaN

    setText('ab-primary', primary)
    setText(
      'ab-cag',
      format(correctedAG, 1) + (Number.isFinite(correctedAG) ? ' mEq/L' : '')
    )
    setText('ab-delta', format(deltaRatio, 2))
    setText(
      'ab-be',
      format(baseExcess, 1) + (Number.isFinite(baseExcess) ? ' mEq/L' : '')
    )
    setText(
      'ab-cna',
      format(correctedNa, 1) + (Number.isFinite(correctedNa) ? ' mEq/L' : '')
    )
    setText(
      'ab-cca',
      format(correctedCa, 1) + (Number.isFinite(correctedCa) ? ' mg/dL' : '')
    )

    setText('ab-comp', compensationInterpretation(primary, pCO2, hco3))

    var differentialText = buildDifferentials(primary, correctedAG)
    var deltaText = deltaRatioInterpretation(deltaRatio)
    setText('ab-note', differentialText + ' ' + deltaText)

    if (Number.isFinite(osmolality)) {
      setText(
        'ab-osm',
        'Estimated osmolality: ' +
          format(osmolality, 1) +
          ' mOsm/kg (2 x Na + glucose/18 + BUN/2.8).'
      )
      if (!alertMessage && osmolality > 330) {
        alertMessage =
          'Marked hyperosmolar estimate detected. Correlate clinically and confirm with measured osmolality if available.'
        alertLevel = 'caution'
      }
    } else {
      setText('ab-osm', 'Provide Na, glucose, and BUN to estimate osmolality.')
    }

    if (!alertMessage && primary.indexOf('Mixed') !== -1) {
      alertMessage =
        'Mixed acid-base pattern suspected. Full blood gas and clinical context are required before treatment decisions.'
      alertLevel = 'caution'
    }

    setAlert(alertMessage, alertLevel)
  }

  function init() {
    var form = document.getElementById('ab-form')
    if (!form) {
      return
    }
    form.addEventListener('submit', calculate)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
