;(function () {
  'use strict'

  var PLAN_FACTORS = {
    weight_loss: { dog: 1, cat: 0.8 },
    maintenance_neutered: { dog: 1.6, cat: 1.2 },
    maintenance_intact: { dog: 1.8, cat: 1.4 },
    growth_under_4mo: { dog: 3, cat: 2.5 },
    growth_over_4mo: { dog: 2, cat: 2 },
    recovery: { dog: 1, cat: 1 },
  }

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

  function getFactor(species, plan) {
    var speciesKey = species === 'cat' ? 'cat' : 'dog'
    var planEntry = PLAN_FACTORS[plan] || PLAN_FACTORS.maintenance_neutered
    var value = planEntry[speciesKey]
    return Number.isFinite(value)
      ? value
      : PLAN_FACTORS.maintenance_neutered[speciesKey]
  }

  function render(event) {
    if (event) {
      event.preventDefault()
    }

    var species = String(document.getElementById('nrm-species').value || 'dog')
    var weight = toNumber(document.getElementById('nrm-weight').value)
    var plan = String(
      document.getElementById('nrm-plan').value || 'maintenance_neutered'
    )
    var kcalPerCup = toNumber(document.getElementById('nrm-kcal-cup').value)

    if (!Number.isFinite(weight) || weight <= 0) {
      setText('nrm-note', 'Enter a valid body weight.')
      return
    }

    var rer = 70 * Math.pow(weight, 0.75)
    var factor = getFactor(species, plan)
    var mer = rer * factor

    setText('nrm-rer', format(rer, 0, ' kcal/day'))
    setText('nrm-mer', format(mer, 0, ' kcal/day'))

    if (Number.isFinite(kcalPerCup) && kcalPerCup > 0) {
      var cups = mer / kcalPerCup
      setText('nrm-cups', format(cups, 2, ' cups/day'))
    } else {
      setText('nrm-cups', '-')
    }

    var planNote =
      'Factor used: ' +
      format(factor, 2) +
      ' x RER for ' +
      (species === 'cat' ? 'cat' : 'dog') +
      '.'
    setText(
      'nrm-note',
      planNote +
        ' Use ideal body weight targets and reassess body condition score every 2-4 weeks during plan adjustments.'
    )
  }

  function init() {
    var form = document.getElementById('nrm-form')
    if (!form) {
      return
    }
    form.addEventListener('submit', render)
    form.addEventListener('change', render)
    form.addEventListener('input', render)
    render()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
