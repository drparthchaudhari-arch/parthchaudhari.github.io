;(function () {
  'use strict'

  var DRUGS = [
    {
      id: 'amoxicillin',
      label: 'Amoxicillin',
      className: 'Beta-lactam antibiotic',
      intervals: {
        normal: 'q8-12h',
        mild: 'q12h',
        moderate: 'q12-24h',
        severe: 'q24h',
      },
      caution:
        'Primarily renal elimination. Extend interval as azotemia worsens.',
    },
    {
      id: 'amoxicillin_clavulanate',
      label: 'Amoxicillin-Clavulanate',
      className: 'Beta-lactam antibiotic',
      intervals: {
        normal: 'q12h',
        mild: 'q12h',
        moderate: 'q12-24h',
        severe: 'q24h',
      },
      caution:
        'Use interval extension first; reassess GI tolerance and hydration status.',
    },
    {
      id: 'cephalexin',
      label: 'Cephalexin',
      className: 'Cephalosporin antibiotic',
      intervals: {
        normal: 'q12h',
        mild: 'q12h',
        moderate: 'q12-24h',
        severe: 'q24h',
      },
      caution: 'Monitor for accumulation if appetite and hydration are poor.',
    },
    {
      id: 'cefazolin',
      label: 'Cefazolin',
      className: 'Cephalosporin antibiotic',
      intervals: {
        normal: 'q8h',
        mild: 'q8-12h',
        moderate: 'q12h',
        severe: 'q12-24h',
      },
      caution: 'For hospitalized use, align interval with serial renal trends.',
    },
    {
      id: 'cefpodoxime',
      label: 'Cefpodoxime',
      className: 'Cephalosporin antibiotic',
      intervals: {
        normal: 'q24h',
        mild: 'q24h',
        moderate: 'q24-48h',
        severe: 'q48h',
      },
      caution: 'Longer-acting drug; avoid stacking doses in severe compromise.',
    },
    {
      id: 'enrofloxacin',
      label: 'Enrofloxacin',
      className: 'Fluoroquinolone antibiotic',
      intervals: {
        normal: 'q24h',
        mild: 'q24h',
        moderate: 'q24-36h',
        severe: 'q48h / consider alternative',
      },
      caution:
        'Monitor neurologic status and hydration; avoid excessive accumulation.',
    },
    {
      id: 'marbofloxacin',
      label: 'Marbofloxacin',
      className: 'Fluoroquinolone antibiotic',
      intervals: {
        normal: 'q24h',
        mild: 'q24h',
        moderate: 'q24-36h',
        severe: 'q48h',
      },
      caution: 'Prefer interval adjustment over repeated dose escalation.',
    },
    {
      id: 'metronidazole',
      label: 'Metronidazole',
      className: 'Nitroimidazole antimicrobial',
      intervals: {
        normal: 'q12h',
        mild: 'q12h',
        moderate: 'q12-24h',
        severe: 'q24h / lower dose',
      },
      caution:
        'Neurotoxicity risk increases with prolonged exposure in advanced disease.',
    },
    {
      id: 'famotidine',
      label: 'Famotidine',
      className: 'H2 blocker',
      intervals: {
        normal: 'q12h',
        mild: 'q24h',
        moderate: 'q24h',
        severe: 'q24-48h',
      },
      caution:
        'Interval extension is preferred over dose stacking in severe azotemia.',
    },
    {
      id: 'gabapentin',
      label: 'Gabapentin',
      className: 'Neuropathic analgesic',
      intervals: {
        normal: 'q8-12h',
        mild: 'q12h',
        moderate: 'q12-24h',
        severe: 'q24h',
      },
      caution:
        'Sedation risk rises with renal compromise; start lower and titrate carefully.',
    },
    {
      id: 'levetiracetam',
      label: 'Levetiracetam',
      className: 'Anticonvulsant',
      intervals: {
        normal: 'q8h',
        mild: 'q8-12h',
        moderate: 'q12h',
        severe: 'q12-24h',
      },
      caution:
        'Renal clearance is substantial; avoid abrupt high-frequency dosing in severe compromise.',
    },
    {
      id: 'fluconazole',
      label: 'Fluconazole',
      className: 'Antifungal',
      intervals: {
        normal: 'q24h',
        mild: 'q24h',
        moderate: 'q24-48h',
        severe: 'q48h',
      },
      caution:
        'Reduce exposure in advanced CKD and monitor liver/kidney trends together.',
    },
    {
      id: 'tramadol',
      label: 'Tramadol',
      className: 'Analgesic',
      intervals: {
        normal: 'q8-12h',
        mild: 'q12h',
        moderate: 'q12-24h',
        severe: 'q24h',
      },
      caution:
        'Sedation and dysphoria may increase; reassess comfort plan frequently.',
    },
    {
      id: 'furosemide',
      label: 'Furosemide',
      className: 'Loop diuretic',
      intervals: {
        normal: 'q8-12h',
        mild: 'q8-12h',
        moderate: 'q12h',
        severe: 'q12-24h (titrate to effect)',
      },
      caution:
        'Dose frequency depends on congestion and hydration; monitor electrolytes and renal values closely.',
    },
    {
      id: 'spironolactone',
      label: 'Spironolactone',
      className: 'Aldosterone antagonist',
      intervals: {
        normal: 'q24h',
        mild: 'q24h',
        moderate: 'q24h',
        severe: 'q24-48h / use caution',
      },
      caution:
        'Hyperkalemia risk increases with advanced CKD or concurrent RAAS blockers.',
    },
  ]

  var STAGE_NOTES = {
    normal: 'Baseline renal function selected.',
    mild: 'Mild compromise: usually maintain dose and extend interval only when needed.',
    moderate: 'Moderate compromise: interval extension is commonly required.',
    severe:
      'Severe compromise: conservative intervals and close monitoring are recommended.',
  }

  function byId(id) {
    return document.getElementById(id)
  }

  function setText(id, text) {
    var node = byId(id)
    if (node) {
      node.textContent = text
    }
  }

  function getDrugById(id) {
    for (var i = 0; i < DRUGS.length; i += 1) {
      if (DRUGS[i].id === id) {
        return DRUGS[i]
      }
    }
    return DRUGS[0]
  }

  function populateDrugOptions() {
    var select = byId('rda-drug')
    if (!select) {
      return
    }

    select.innerHTML = ''
    for (var i = 0; i < DRUGS.length; i += 1) {
      var option = document.createElement('option')
      option.value = DRUGS[i].id
      option.textContent = DRUGS[i].label
      select.appendChild(option)
    }
  }

  function render(event) {
    if (event) {
      event.preventDefault()
    }

    var stageNode = byId('rda-stage')
    var drugNode = byId('rda-drug')
    var stage = stageNode ? String(stageNode.value || 'mild') : 'mild'
    var drugKey = drugNode ? String(drugNode.value || DRUGS[0].id) : DRUGS[0].id
    var drug = getDrugById(drugKey)

    if (!drug || !drug.intervals || !drug.intervals[stage]) {
      setText('rda-note', 'Select a valid drug and renal stage.')
      return
    }

    setText('rda-drug-name', drug.label)
    setText('rda-normal', drug.intervals.normal)
    setText('rda-adjusted', drug.intervals[stage])
    setText('rda-caution', drug.className + '. ' + drug.caution)
    setText(
      'rda-note',
      STAGE_NOTES[stage] +
        ' Educational interval-support output. Confirm final dosing with clinician-approved formulary and patient trends.'
    )
  }

  function init() {
    var form = byId('rda-form')
    if (!form) {
      return
    }

    populateDrugOptions()
    form.addEventListener('submit', render)
    form.addEventListener('change', render)
    render()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
