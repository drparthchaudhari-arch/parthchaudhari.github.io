;(function () {
  'use strict'

  var CHOCOLATE = {
    white: { name: 'White chocolate', methylxanthinesMgPerOz: 0.5 },
    milk: { name: 'Milk chocolate', methylxanthinesMgPerOz: 64 },
    dark: { name: 'Dark chocolate', methylxanthinesMgPerOz: 142 },
    semiSweet: { name: 'Semi-sweet chocolate', methylxanthinesMgPerOz: 160 },
    baking: { name: 'Baking chocolate', methylxanthinesMgPerOz: 440 },
    cocoaPowder: { name: 'Cocoa powder', methylxanthinesMgPerOz: 807 },
  }

  var XYLITOL_PRODUCTS = {
    gum: { label: 'Sugar-free gum', mgPerUnit: 500 },
    peanutButter: { label: 'Sugar-free peanut butter', mgPerUnit: 1080 },
    mouthwash: { label: 'Mouthwash', mgPerUnit: 200 },
    custom: { label: 'Custom', mgPerUnit: NaN },
  }

  var RODENTICIDES = {
    warfarin: {
      label: 'Warfarin',
      toxicDoseMgKg: 0.5,
      onset: '3-5 days',
      antidote: 'Vitamin K1',
      note: 'Anticoagulant; monitor PT/INR at 48-72h.',
    },
    bromadiolone: {
      label: 'Bromadiolone',
      toxicDoseMgKg: 0.25,
      onset: '2-5 days',
      antidote: 'Vitamin K1 (often prolonged)',
      note: 'Second-generation anticoagulant with prolonged half-life.',
    },
    bromethalin: {
      label: 'Bromethalin',
      toxicDoseMgKg: 0.3,
      onset: '12h to 7 days',
      antidote: 'No specific antidote',
      note: 'Neurotoxic; monitor for tremors, seizures, cerebral edema.',
    },
    cholecalciferol: {
      label: 'Cholecalciferol',
      toxicDoseMgKg: 0.5,
      onset: '12-36h',
      antidote: 'No single antidote; calcium-lowering protocol needed',
      note: 'Hypercalcemia and renal injury risk.',
    },
    zincPhosphide: {
      label: 'Zinc phosphide',
      toxicDoseMgKg: 40,
      onset: '15 min to 4h',
      antidote: 'No specific antidote',
      note: 'Phosphine gas exposure risk; avoid inducing emesis in poorly ventilated spaces.',
    },
  }

  function toNumber(value) {
    var parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : NaN
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) {
      return '-'
    }
    return value.toFixed(digits)
  }

  function setText(id, text) {
    var node = document.getElementById(id)
    if (node) {
      node.textContent = text
    }
  }

  function getMode() {
    return String(document.getElementById('tox-mode').value || 'chocolate')
  }

  function showPanels(mode) {
    var panels = document.querySelectorAll('[data-tox-panel]')
    for (var i = 0; i < panels.length; i += 1) {
      panels[i].hidden = panels[i].getAttribute('data-tox-panel') !== mode
    }
  }

  function getEmesisWindow(hours, contraindicated) {
    if (contraindicated) {
      return 'Avoid emesis'
    }
    if (hours < 2) {
      return 'Likely beneficial'
    }
    if (hours <= 4) {
      return 'Possible limited benefit'
    }
    return 'Usually beyond useful window'
  }

  function calculateChocolate(weight, hours, contraindicated) {
    var chocolateType = String(
      document.getElementById('tox-chocolate-type').value || 'milk'
    )
    var amountOz = toNumber(
      document.getElementById('tox-chocolate-amount').value
    )
    var typeData = CHOCOLATE[chocolateType] || CHOCOLATE.milk

    if (!Number.isFinite(amountOz) || amountOz < 0) {
      return {
        ok: false,
        alert: {
          level: 'danger',
          text: 'Enter a valid chocolate amount in ounces.',
        },
      }
    }

    var totalMg = typeData.methylxanthinesMgPerOz * amountOz
    var doseMgKg = totalMg / weight

    var risk = 'Low'
    var action = 'Monitor for GI upset and restlessness.'
    var monitoring =
      'Home monitoring may be acceptable if asymptomatic and low dose.'
    var alert = {
      level: 'caution',
      text: 'Call a veterinarian if clinical signs begin.',
    }

    if (doseMgKg >= 60) {
      risk = 'Severe-Lethal Range'
      action =
        'Emergency treatment now: decontamination, charcoal, fluids, arrhythmia/seizure support.'
      monitoring = 'Continuous ECG/neurologic monitoring likely required.'
      alert = {
        level: 'danger',
        text: 'Critical methylxanthine dose estimate.',
      }
    } else if (doseMgKg >= 40) {
      risk = 'Moderate-Severe'
      action = 'Urgent emergency evaluation advised.'
      monitoring = 'Watch for tachycardia, hyperthermia, tremors, arrhythmias.'
      alert = {
        level: 'danger',
        text: 'Dose likely to cause significant clinical signs.',
      }
    } else if (doseMgKg >= 20) {
      risk = 'Mild-Moderate'
      action =
        'Prompt vet guidance recommended. Decontamination may still help.'
      monitoring = 'Monitor GI signs, agitation, and heart rate changes.'
    }

    return {
      ok: true,
      doseText: format(doseMgKg, 1) + ' mg/kg methylxanthines',
      risk: risk,
      emesis: getEmesisWindow(hours, contraindicated),
      action: typeData.name + ': ' + action,
      monitoring:
        monitoring +
        ' Approximate half-life in dogs is prolonged (about 17.5h).',
      alert: contraindicated
        ? {
            level: 'danger',
            text: 'Contraindication flag present: avoid emesis without clinician confirmation.',
          }
        : alert,
    }
  }

  function calculateXylitol(weight, hours, contraindicated) {
    var product = String(
      document.getElementById('tox-xylitol-product').value || 'gum'
    )
    var amount = toNumber(document.getElementById('tox-xylitol-amount').value)
    var custom = toNumber(document.getElementById('tox-xylitol-custom').value)
    var mgPerUnit = XYLITOL_PRODUCTS[product]
      ? XYLITOL_PRODUCTS[product].mgPerUnit
      : NaN

    if (product === 'custom') {
      mgPerUnit = custom
    }

    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      !Number.isFinite(mgPerUnit) ||
      mgPerUnit <= 0
    ) {
      return {
        ok: false,
        alert: {
          level: 'danger',
          text: 'Enter valid xylitol amount and mg-per-unit values.',
        },
      }
    }

    var totalGrams = (mgPerUnit * amount) / 1000
    var doseGKg = totalGrams / weight

    var risk = 'Low'
    var action =
      'Monitor closely for weakness, vomiting, tremors, and lethargy.'
    var monitoring =
      'If signs develop, immediate blood glucose testing is required.'
    var alert = {
      level: 'caution',
      text: 'Xylitol can trigger rapid insulin release.',
    }

    if (doseGKg >= 0.5) {
      risk = 'High (Hepatic Injury Risk)'
      action =
        'Emergency hospitalization advised. Decontamination and aggressive hepatic monitoring needed.'
      monitoring =
        'Serial glucose, ALT/AST, bilirubin, coagulation profile over 72h.'
      alert = {
        level: 'danger',
        text: 'Dose above hepatotoxic threshold (>= 0.5 g/kg).',
      }
    } else if (doseGKg >= 0.1) {
      risk = 'Moderate (Hypoglycemia Risk)'
      action = 'Prompt decontamination and glucose monitoring are recommended.'
      monitoring = 'Blood glucose checks every 30-60 min initially.'
      alert = {
        level: 'danger',
        text: 'Dose above hypoglycemia threshold (>= 0.1 g/kg).',
      }
    }

    return {
      ok: true,
      doseText: format(doseGKg, 2) + ' g/kg xylitol',
      risk: risk,
      emesis: getEmesisWindow(hours, contraindicated),
      action: action,
      monitoring: monitoring,
      alert: contraindicated
        ? {
            level: 'danger',
            text: 'Contraindication flag present: avoid emesis without clinician confirmation.',
          }
        : alert,
    }
  }

  function calculateRodenticide(weight, hours, contraindicated) {
    var rodenticideType = String(
      document.getElementById('tox-rodenticide-type').value || 'warfarin'
    )
    var amountGrams = toNumber(
      document.getElementById('tox-rodenticide-amount').value
    )
    var concentrationPercent = toNumber(
      document.getElementById('tox-rodenticide-percent').value
    )
    var typeData = RODENTICIDES[rodenticideType] || RODENTICIDES.warfarin

    if (
      !Number.isFinite(amountGrams) ||
      amountGrams < 0 ||
      !Number.isFinite(concentrationPercent) ||
      concentrationPercent <= 0
    ) {
      return {
        ok: false,
        alert: {
          level: 'danger',
          text: 'Enter valid rodenticide bait amount and concentration percent.',
        },
      }
    }

    var activeMg = amountGrams * 1000 * (concentrationPercent / 100)
    var doseMgKg = activeMg / weight
    var ratioToToxic = doseMgKg / typeData.toxicDoseMgKg

    var risk = 'Low'
    var action =
      'Discuss decontamination and home monitoring plan with veterinarian.'
    var alert = {
      level: 'caution',
      text: 'Any rodenticide ingestion warrants veterinary consultation.',
    }

    if (ratioToToxic >= 2) {
      risk = 'High'
      action =
        'Emergency treatment recommended now. Start targeted tox protocol.'
      alert = {
        level: 'danger',
        text: 'Estimated dose exceeds 2x listed toxic threshold.',
      }
    } else if (ratioToToxic >= 1) {
      risk = 'Moderate'
      action = 'Urgent decontamination and directed monitoring advised.'
      alert = {
        level: 'danger',
        text: 'Estimated dose is at or above listed toxic threshold.',
      }
    }

    return {
      ok: true,
      doseText: format(doseMgKg, 3) + ' mg/kg active ingredient',
      risk: risk + ' (' + typeData.label + ')',
      emesis: getEmesisWindow(hours, contraindicated),
      action: action + ' Antidote note: ' + typeData.antidote + '.',
      monitoring: 'Expected onset: ' + typeData.onset + '. ' + typeData.note,
      alert: contraindicated
        ? {
            level: 'danger',
            text: 'Contraindication flag present: avoid emesis without clinician confirmation.',
          }
        : alert,
    }
  }

  function setAlert(alert) {
    var node = document.getElementById('tox-alert')
    if (!node) {
      return
    }

    if (!alert) {
      node.hidden = true
      node.textContent = ''
      node.className = 'pc-calculator-warning'
      return
    }

    node.hidden = false
    node.textContent = alert.text
    node.className = 'pc-calculator-warning'
    if (alert.level === 'danger') {
      node.classList.add('pc-calculator-warning--danger')
    } else if (alert.level === 'caution') {
      node.classList.add('pc-calculator-warning--caution')
    }
  }

  function render(event) {
    if (event) {
      event.preventDefault()
    }

    var mode = getMode()
    var weight = toNumber(document.getElementById('tox-weight').value)
    var hours = toNumber(document.getElementById('tox-hours').value)
    var neuro = document.getElementById('tox-neuro').checked
    var corrosive = document.getElementById('tox-corrosive').checked
    var hydrocarbon = document.getElementById('tox-hydrocarbon').checked

    if (
      !Number.isFinite(weight) ||
      weight <= 0 ||
      !Number.isFinite(hours) ||
      hours < 0
    ) {
      setAlert({
        level: 'danger',
        text: 'Enter valid weight and hours-since-ingestion inputs.',
      })
      setText('tox-action', 'Input validation failed.')
      setText('tox-monitoring', '-')
      setText('tox-dose', '-')
      setText('tox-risk', '-')
      setText('tox-emesis', '-')
      return
    }

    var contraindicated = neuro || corrosive || hydrocarbon
    var result

    if (mode === 'xylitol') {
      result = calculateXylitol(weight, hours, contraindicated)
    } else if (mode === 'rodenticide') {
      result = calculateRodenticide(weight, hours, contraindicated)
    } else {
      result = calculateChocolate(weight, hours, contraindicated)
    }

    if (!result.ok) {
      setAlert(result.alert)
      setText('tox-action', 'Input validation failed.')
      setText('tox-monitoring', '-')
      setText('tox-dose', '-')
      setText('tox-risk', '-')
      setText('tox-emesis', '-')
      return
    }

    setText('tox-dose', result.doseText)
    setText('tox-risk', result.risk)
    setText('tox-emesis', result.emesis)
    setText('tox-action', result.action)
    setText('tox-monitoring', result.monitoring)
    setAlert(result.alert)
  }

  function handleModeChange() {
    showPanels(getMode())
    render()
  }

  function handleXylitolProductChange() {
    var product = String(
      document.getElementById('tox-xylitol-product').value || 'gum'
    )
    var customWrap = document.getElementById('tox-xylitol-custom-wrap')
    if (customWrap) {
      customWrap.hidden = product !== 'custom'
    }
    render()
  }

  function init() {
    var form = document.getElementById('tox-form')
    var modeSelect = document.getElementById('tox-mode')
    var xylitolSelect = document.getElementById('tox-xylitol-product')

    if (!form || !modeSelect || !xylitolSelect) {
      return
    }

    showPanels(getMode())

    form.addEventListener('submit', render)
    modeSelect.addEventListener('change', handleModeChange)
    xylitolSelect.addEventListener('change', handleXylitolProductChange)

    var reactiveInputs = form.querySelectorAll('input, select')
    for (var i = 0; i < reactiveInputs.length; i += 1) {
      if (
        reactiveInputs[i].id === 'tox-mode' ||
        reactiveInputs[i].id === 'tox-xylitol-product'
      ) {
        continue
      }
      reactiveInputs[i].addEventListener('change', render)
    }

    render()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
