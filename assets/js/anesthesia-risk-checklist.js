;(function () {
  'use strict'

  var FACTORS = [
    { id: 'ars-age', weight: 1 },
    { id: 'ars-cardiac', weight: 3 },
    { id: 'ars-respiratory', weight: 3 },
    { id: 'ars-renal-hepatic', weight: 3 },
    { id: 'ars-anemia', weight: 2 },
    { id: 'ars-hypotension-history', weight: 2 },
    { id: 'ars-emergency-procedure', weight: 2 },
  ]

  function byId(id) {
    return document.getElementById(id)
  }

  function setText(id, text) {
    var node = byId(id)
    if (node) {
      node.textContent = text
    }
  }

  function getCheckedScore() {
    var score = 0
    for (var i = 0; i < FACTORS.length; i += 1) {
      var checkbox = byId(FACTORS[i].id)
      if (checkbox && checkbox.checked) {
        score += FACTORS[i].weight
      }
    }
    return score
  }

  function getAsaBase() {
    var asa = byId('ars-asa')
    var value = asa ? Number(asa.value || '1') : 1
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      return 1
    }
    return value
  }

  function renderChecklist(event) {
    if (event) {
      event.preventDefault()
    }

    var asa = getAsaBase()
    var score = getCheckedScore()
    var total = asa + score

    var tier
    var checklist

    if (total <= 3) {
      tier = 'Low peri-anesthetic risk'
      checklist =
        'Standard monitoring, IV access, BP + SpO2 + ETCO2, and routine recovery checks.'
    } else if (total <= 7) {
      tier = 'Moderate peri-anesthetic risk'
      checklist =
        'Pre-oxygenate, secure warming plan, repeat BP trends, and assign dedicated recovery supervision.'
    } else {
      tier = 'High peri-anesthetic risk'
      checklist =
        'Stabilize before induction when possible, prepare vasopressor/fluids plan, and perform intensive post-op monitoring.'
    }

    setText('ars-score', String(total))
    setText('ars-tier', tier)
    setText('ars-checklist', checklist)

    var note =
      'Generated from ASA base ' +
      asa +
      ' plus weighted risk factors (' +
      score +
      ' points).'
    if (total >= 8) {
      note +=
        ' Strongly consider delaying non-emergency anesthesia until stabilization targets are met.'
    }
    setText('ars-note', note)
  }

  function init() {
    var form = byId('ars-form')
    if (!form) {
      return
    }

    form.addEventListener('submit', renderChecklist)
    form.addEventListener('change', renderChecklist)
    renderChecklist()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
