/**
 * VetLudics - Comprehensive Toxicity Suite
 * Calculates toxicity risk for various substances in dogs and cats
 */

;(function () {
  'use strict'

  // Toxicity data
  const TOXICITY_DATA = {
    chocolate: {
      types: {
        white: { name: 'White chocolate', mgPerOz: 0.5, riskThresholds: { low: 0, mod: 20, high: 40 } },
        milk: { name: 'Milk chocolate', mgPerOz: 64, riskThresholds: { low: 0, mod: 20, high: 40 } },
        dark: { name: 'Dark chocolate', mgPerOz: 142, riskThresholds: { low: 0, mod: 20, high: 40 } },
        semiSweet: { name: 'Semi-sweet', mgPerOz: 160, riskThresholds: { low: 0, mod: 20, high: 40 } },
        baking: { name: 'Baking chocolate', mgPerOz: 440, riskThresholds: { low: 0, mod: 20, high: 40 } },
        cocoaPowder: { name: 'Cocoa powder', mgPerOz: 807, riskThresholds: { low: 0, mod: 20, high: 40 } }
      },
      thresholds: {
        mild: 20,      // mg/kg methylxanthines
        moderate: 40,  // mg/kg
        severe: 60     // mg/kg
      }
    },
    xylitol: {
      products: {
        gum: { mgPerUnit: 500, unitName: 'piece' },
        peanutButter: { mgPerUnit: 1080, unitName: 'tbsp' },
        mouthwash: { mgPerUnit: 200, unitName: 'mL' },
        bakedGoods: { mgPerUnit: 1, unitName: 'custom' },
        custom: { mgPerUnit: null, unitName: 'custom' }
      },
      thresholds: {
        hypoglycemia: 0.1,  // g/kg
        hepatotoxic: 0.5    // g/kg
      }
    },
    rodenticide: {
      types: {
        warfarin: { 
          name: 'Warfarin (1st-gen)',
          toxicDose: 0.5, 
          onset: '3-5 days',
          antidote: 'Vitamin K1',
          note: 'Monitor PT/INR at 48-72h'
        },
        bromadiolone: { 
          name: 'Bromadiolone (2nd-gen)',
          toxicDose: 0.25, 
          onset: '2-5 days',
          antidote: 'Vitamin K1 (prolonged)',
          note: 'Long half-life, may need weeks of treatment'
        },
        difenacoum: { 
          name: 'Difenacoum (2nd-gen)',
          toxicDose: 0.25, 
          onset: '2-5 days',
          antidote: 'Vitamin K1 (prolonged)',
          note: 'Very long half-life'
        },
        bromethalin: { 
          name: 'Bromethalin (neurotoxic)',
          toxicDose: 0.3, 
          onset: '12h to 7 days',
          antidote: 'None specific',
          note: 'Cerebral edema risk, no antidote'
        },
        cholecalciferol: { 
          name: 'Cholecalciferol (Vit D3)',
          toxicDose: 0.5, 
          onset: '12-36h',
          antidote: 'None specific',
          note: 'Hypercalcemia, renal injury risk'
        },
        zincPhosphide: { 
          name: 'Zinc phosphide',
          toxicDose: 40, 
          onset: '15 min to 4h',
          antidote: 'None specific',
          note: 'Phosphine gas risk, ventilate area'
        }
      }
    },
    grapes: {
      thresholds: {
        dog: 0.007, // oz/kg (approximate, varies)
        cat: 0.007
      },
      raisinMultiplier: 4.5 // raisins more concentrated
    },
    medication: {
      drugs: {
        ibuprofen: { toxicDose: 100, name: 'Ibuprofen', symptoms: 'GI ulceration, renal failure' },
        acetaminophen: { toxicDose: 75, name: 'Acetaminophen', symptoms: 'Hepatotoxicity, methemoglobinemia (cats)' },
        aspirin: { toxicDose: 30, name: 'Aspirin', symptoms: 'GI ulceration, metabolic acidosis' },
        naproxen: { toxicDose: 5, name: 'Naproxen', symptoms: 'Severe GI/renal toxicity' },
        pseudoephedrine: { toxicDose: 1, name: 'Pseudoephedrine', symptoms: 'Hypertension, hyperthermia, seizures' },
        diphenhydramine: { toxicDose: 4, name: 'Diphenhydramine', symptoms: 'Sedation, anticholinergic effects' },
        metformin: { toxicDose: 85, name: 'Metformin', symptoms: 'Lactic acidosis, hypoglycemia' },
        albuterol: { toxicDose: 0.5, name: 'Albuterol', symptoms: 'Tachycardia, tremors, hypokalemia' }
      }
    },
    macadamia: {
      toxicDose: 2.2, // g/kg
      nutWeight: 3 // average grams per nut
    }
  }

  let currentMode = 'chocolate'

  function toNumber(value) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : NaN
  }

  function format(value, digits = 1) {
    if (!Number.isFinite(value)) return '-'
    return value.toFixed(digits)
  }

  function setText(id, text) {
    const node = document.getElementById(id)
    if (node) node.textContent = text
  }

  function showPanel(mode) {
    document.querySelectorAll('[data-tox-panel]').forEach(panel => {
      panel.hidden = panel.dataset.toxPanel !== mode
    })
  }

  function updateModeButtons(mode) {
    document.querySelectorAll('[data-tox-mode]').forEach(btn => {
      const isActive = btn.dataset.toxMode === mode
      btn.classList.toggle('pc-is-active', isActive)
      btn.setAttribute('aria-selected', isActive)
    })
  }

  function getContraindications() {
    return {
      neuro: document.getElementById('tox-neuro')?.checked || false,
      corrosive: document.getElementById('tox-corrosive')?.checked || false,
      hydrocarbon: document.getElementById('tox-hydrocarbon')?.checked || false,
      asymptomatic: document.getElementById('tox-asymptomatic')?.checked || false
    }
  }

  function getEmesisWindow(hours, contras) {
    if (contras.neuro || contras.corrosive) {
      return 'Contraindicated'
    }
    if (hours < 1) return 'Optimal window'
    if (hours < 2) return 'Likely beneficial'
    if (hours <= 4) return 'Possible benefit'
    return 'Beyond useful window'
  }

  function calculateChocolate(weight, hours, contras) {
    const type = document.getElementById('tox-chocolate-type').value
    const amountOz = toNumber(document.getElementById('tox-chocolate-amount').value)
    const data = TOXICITY_DATA.chocolate.types[type]

    if (!Number.isFinite(amountOz) || amountOz <= 0) {
      return { ok: false, alert: { type: 'danger', title: 'Invalid Input', text: 'Enter a valid chocolate amount.' } }
    }

    const totalMg = data.mgPerOz * amountOz
    const doseMgKg = totalMg / weight

    let risk = 'Low'
    let action = 'Monitor at home for GI upset and restlessness.'
    let monitoring = 'If asymptomatic, home observation may be appropriate.'
    let alertType = 'info'

    if (doseMgKg >= 60) {
      risk = 'Severe-Lethal'
      action = 'EMERGENCY: Immediate decontamination, IV fluids, ECG monitoring, seizure prophylaxis.'
      monitoring = 'Hospitalization with continuous monitoring required.'
      alertType = 'danger'
    } else if (doseMgKg >= 40) {
      risk = 'Moderate-Severe'
      action = 'Urgent veterinary care: decontamination, activated charcoal, supportive care.'
      monitoring = 'Watch for tachycardia, hyperthermia, tremors, arrhythmias.'
      alertType = 'danger'
    } else if (doseMgKg >= 20) {
      risk = 'Mild-Moderate'
      action = 'Veterinary evaluation recommended. Decontamination may still help.'
      monitoring = 'Monitor for vomiting, agitation, increased heart rate.'
      alertType = 'warning'
    }

    return {
      ok: true,
      doseText: `${format(doseMgKg)} mg/kg methylxanthines`,
      risk,
      emesis: getEmesisWindow(hours, contras),
      action: `${data.name}: ${action}`,
      monitoring: `${monitoring} Half-life ~17.5h in dogs.`,
      alert: { type: alertType, title: alertType === 'danger' ? 'High Risk' : 'Caution', text: action }
    }
  }

  function calculateXylitol(weight, hours, contras) {
    const product = document.getElementById('tox-xylitol-product').value
    const amount = toNumber(document.getElementById('tox-xylitol-amount').value)
    let mgPerUnit = TOXICITY_DATA.xylitol.products[product].mgPerUnit

    if (product === 'custom') {
      mgPerUnit = toNumber(document.getElementById('tox-xylitol-custom').value)
    }

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(mgPerUnit)) {
      return { ok: false, alert: { type: 'danger', title: 'Invalid Input', text: 'Enter valid xylitol amount.' } }
    }

    const totalGrams = (mgPerUnit * amount) / 1000
    const doseGKg = totalGrams / weight

    let risk = 'Low'
    let action = 'Monitor for weakness, vomiting, tremors. Check blood glucose if symptomatic.'
    let alertType = 'info'

    if (doseGKg >= 0.5) {
      risk = 'High (Hepatotoxic)'
      action = 'EMERGENCY: Hospitalize for decontamination, IV dextrose, hepatic monitoring (ALT/AST, bilirubin, coagulation).'
      alertType = 'danger'
    } else if (doseGKg >= 0.1) {
      risk = 'Moderate (Hypoglycemia)'
      action = 'Urgent care: Decontamination if within window, glucose monitoring q30-60min.'
      alertType = 'danger'
    }

    return {
      ok: true,
      doseText: `${format(doseGKg, 2)} g/kg xylitol`,
      risk,
      emesis: getEmesisWindow(hours, contras),
      action,
      monitoring: doseGKg >= 0.5 ? 'Monitor glucose and liver values for 72h.' : 'Monitor glucose for 12h.',
      alert: { type: alertType, title: risk.includes('High') ? 'High Risk' : 'Caution', text: action }
    }
  }

  function calculateRodenticide(weight, hours, contras) {
    const type = document.getElementById('tox-rodenticide-type').value
    const amountG = toNumber(document.getElementById('tox-rodenticide-amount').value)
    const percent = toNumber(document.getElementById('tox-rodenticide-percent').value)
    const data = TOXICITY_DATA.rodenticide.types[type]

    if (!Number.isFinite(amountG) || amountG <= 0) {
      return { ok: false, alert: { type: 'danger', title: 'Invalid Input', text: 'Enter valid bait amount.' } }
    }

    const activeMg = amountG * 1000 * (percent / 100)
    const doseMgKg = activeMg / weight
    const ratio = doseMgKg / data.toxicDose

    let risk = 'Low'
    let action = `Contact veterinarian. ${data.antidote} if indicated.`
    let alertType = 'warning'

    if (ratio >= 2) {
      risk = 'High'
      action = `EMERGENCY: ${data.note} Start treatment protocol immediately.`
      alertType = 'danger'
    } else if (ratio >= 1) {
      risk = 'Moderate'
      action = `Urgent: Decontamination and monitoring. ${data.note}`
      alertType = 'danger'
    }

    return {
      ok: true,
      doseText: `${format(doseMgKg, 3)} mg/kg`,
      risk: `${risk} (${data.name})`,
      emesis: getEmesisWindow(hours, contras),
      action,
      monitoring: `Onset: ${data.onset}. Antidote: ${data.antidote}`,
      alert: { type: alertType, title: risk === 'Low' ? 'Caution' : 'High Risk', text: action }
    }
  }

  function calculateGrapes(weight, hours, contras) {
    const type = document.getElementById('tox-grape-type').value
    const amount = toNumber(document.getElementById('tox-grape-amount').value)

    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, alert: { type: 'danger', title: 'Invalid Input', text: 'Enter valid amount.' } }
    }

    // Any amount can be toxic - idiosyncratic reaction
    const multiplier = type === 'raisins' ? TOXICITY_DATA.grapes.raisinMultiplier : 1
    const adjustedAmount = amount * multiplier

    // Risk assessment based on amount (though any amount is potentially toxic)
    let risk = 'Unknown/Potential'
    let action = 'Decontamination recommended if within 2 hours. Kidney monitoring essential.'

    if (adjustedAmount >= 0.5) {
      risk = 'High Risk'
      action = 'HIGH RISK: Decontamination, IV fluids, monitor renal values (BUN, creatinine, SDMA) for 72h.'
    } else if (adjustedAmount >= 0.1) {
      risk = 'Moderate Risk'
      action = 'Moderate concern: Decontamination if possible, monitor renal values.'
    }

    return {
      ok: true,
      doseText: `${format(adjustedAmount)} ${type}/kg equivalent`,
      risk,
      emesis: getEmesisWindow(hours, contras),
      action,
      monitoring: 'Monitor renal values at 24h, 48h, 72h. Any amount potentially nephrotoxic in dogs.',
      alert: { type: 'warning', title: 'Potential Nephrotoxin', text: 'Any amount of grapes/raisins can cause AKI in dogs.' }
    }
  }

  function calculateMedication(weight, hours, contras) {
    const drug = document.getElementById('tox-medication-type').value
    const amountMg = toNumber(document.getElementById('tox-medication-mg').value)
    const data = TOXICITY_DATA.medication.drugs[drug]

    if (!Number.isFinite(amountMg) || amountMg <= 0) {
      return { ok: false, alert: { type: 'danger', title: 'Invalid Input', text: 'Enter valid medication amount.' } }
    }

    const doseMgKg = amountMg / weight
    const ratio = doseMgKg / data.toxicDose

    let risk = 'Low'
    let action = `Monitor for ${data.symptoms}. Contact veterinarian.`
    let alertType = 'info'

    if (ratio >= 2) {
      risk = 'Severe'
      action = `EMERGENCY: ${data.symptoms}. Immediate veterinary care required.`
      alertType = 'danger'
    } else if (ratio >= 1) {
      risk = 'Moderate-High'
      action = `Urgent: ${data.symptoms}. Veterinary evaluation now.`
      alertType = 'danger'
    } else if (ratio >= 0.5) {
      risk = 'Mild-Moderate'
      action = `Veterinary consultation recommended. Watch for ${data.symptoms}.`
      alertType = 'warning'
    }

    return {
      ok: true,
      doseText: `${format(doseMgKg)} mg/kg`,
      risk: `${risk} (${data.name})`,
      emesis: getEmesisWindow(hours, contras),
      action,
      monitoring: `Watch for: ${data.symptoms}`,
      alert: { type: alertType, title: alertType === 'info' ? 'Monitor' : 'Caution', text: action }
    }
  }

  function calculateMacadamia(weight, hours, contras) {
    const amount = toNumber(document.getElementById('tox-macadamia-amount').value)
    const unit = document.getElementById('tox-macadamia-unit').value

    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, alert: { type: 'danger', title: 'Invalid Input', text: 'Enter valid amount.' } }
    }

    // Convert to grams
    const grams = unit === 'nuts' ? amount * TOXICITY_DATA.macadamia.nutWeight : amount
    const doseGKg = grams / weight

    let risk = 'Low'
    let action = 'Monitor for weakness, vomiting, tremors, hyperthermia.'
    let alertType = 'info'

    if (doseGKg >= 5) {
      risk = 'High'
      action = 'Severe: Supportive care, IV fluids if needed. Usually self-limiting 12-48h.'
      alertType = 'warning'
    } else if (doseGKg >= 2.2) {
      risk = 'Moderate'
      action = 'Clinical signs likely: weakness, tremors, hyperthermia. Supportive care.'
      alertType = 'warning'
    }

    return {
      ok: true,
      doseText: `${format(doseGKg, 1)} g/kg`,
      risk,
      emesis: getEmesisWindow(hours, contras),
      action,
      monitoring: 'Usually self-limiting within 12-48 hours. Supportive care as needed.',
      alert: { type: alertType, title: 'Macadamia Toxicity', text: action }
    }
  }

  function calculate() {
    const weight = toNumber(document.getElementById('tox-weight').value)
    const hours = toNumber(document.getElementById('tox-hours').value)
    const contras = getContraindications()

    if (!Number.isFinite(weight) || weight <= 0) {
      showAlert({ type: 'danger', title: 'Invalid Weight', text: 'Enter a valid patient weight.' })
      return
    }

    let result
    switch (currentMode) {
      case 'chocolate': result = calculateChocolate(weight, hours, contras); break
      case 'xylitol': result = calculateXylitol(weight, hours, contras); break
      case 'rodenticide': result = calculateRodenticide(weight, hours, contras); break
      case 'grapes': result = calculateGrapes(weight, hours, contras); break
      case 'medication': result = calculateMedication(weight, hours, contras); break
      case 'macadamia': result = calculateMacadamia(weight, hours, contras); break
      default: return
    }

    displayResults(result)
  }

  function displayResults(result) {
    const resultsSection = document.getElementById('tox-results')
    resultsSection.hidden = false
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })

    if (!result.ok) {
      showAlert(result.alert)
      return
    }

    // Update result cards
    setText('tox-result-dose', result.doseText)
    setText('tox-result-risk', result.risk)
    setText('tox-result-emesis', result.emesis)
    setText('tox-result-action', result.action)

    // Update risk card styling
    const riskCard = document.getElementById('tox-result-risk-card')
    riskCard.classList.remove('pc-result-card--danger', 'pc-result-card--warning')
    if (result.risk.toLowerCase().includes('high') || result.risk.toLowerCase().includes('severe')) {
      riskCard.classList.add('pc-result-card--danger')
    } else if (result.risk.toLowerCase().includes('moderate')) {
      riskCard.classList.add('pc-result-card--warning')
    }

    // Show monitoring
    const monitoringCard = document.getElementById('tox-monitoring-card')
    const monitoringText = document.getElementById('tox-result-monitoring')
    if (result.monitoring) {
      monitoringCard.hidden = false
      monitoringText.textContent = result.monitoring
    } else {
      monitoringCard.hidden = true
    }

    // Show alert
    showAlert(result.alert)
  }

  function showAlert(alert) {
    const alertEl = document.getElementById('tox-alert')
    if (!alert) {
      alertEl.hidden = true
      return
    }

    alertEl.hidden = false
    alertEl.className = `pc-calculator-alert pc-calculator-alert--${alert.type}`
    alertEl.innerHTML = `
      <div class="pc-calculator-alert__content">
        <p class="pc-calculator-alert__title">${alert.title}</p>
        <p class="pc-calculator-alert__text">${alert.text}</p>
      </div>
    `
  }

  function handleModeChange(mode) {
    currentMode = mode
    updateModeButtons(mode)
    showPanel(mode)
    
    // Reset results
    document.getElementById('tox-results').hidden = true
  }

  function init() {
    // Mode selector buttons
    document.querySelectorAll('[data-tox-mode]').forEach(btn => {
      btn.addEventListener('click', () => handleModeChange(btn.dataset.toxMode))
    })

    // Form submission
    const form = document.getElementById('tox-form')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      calculate()
    })

    // Xylitol product change
    const xylitolSelect = document.getElementById('tox-xylitol-product')
    if (xylitolSelect) {
      xylitolSelect.addEventListener('change', () => {
        const customWrap = document.getElementById('tox-xylitol-custom-wrap')
        if (customWrap) {
          customWrap.hidden = xylitolSelect.value !== 'custom'
        }
      })
    }

    // Initial setup
    showPanel(currentMode)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
