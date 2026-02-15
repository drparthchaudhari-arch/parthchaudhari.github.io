;(function () {
  'use strict'

  var LIFE_STAGES = {
    dog: [
      { id: 'puppy', label: 'Puppy (< 6 months)' },
      { id: 'adult', label: 'Adult (6 months - 7 years)' },
      { id: 'senior', label: 'Senior (> 7 years)' },
    ],
    cat: [
      { id: 'kitten', label: 'Kitten (< 6 months)' },
      { id: 'adult', label: 'Adult (6 months - 10 years)' },
      { id: 'senior', label: 'Senior (> 10 years)' },
    ],
  }

  var RISK_LABELS = {
    low: 'Indoor / Low Exposure',
    moderate: 'Typical Household Exposure',
    high: 'Outdoor / High Exposure',
  }

  var STAGE_NOTES = {
    dog: {
      puppy:
        'Start nematode deworming at 2, 4, 6, and 8 weeks, then transition to broad-spectrum monthly prevention.',
      adult:
        'Keep year-round prevention and update protocol after travel, daycare exposure, or GI signs.',
      senior:
        'Recheck body weight and comorbidities often to avoid underdosing and interactions.',
    },
    cat: {
      kitten:
        'Deworm at 3, 5, 7, and 9 weeks, then continue monthly prevention as weight allows.',
      adult:
        'Maintain consistent flea and internal parasite prevention even for mostly indoor cats.',
      senior:
        'Adjust product selection for chronic disease and monitor tolerance with each recheck.',
    },
  }

  var PROTOCOLS = {
    dog: [
      {
        focus: 'Fecal Testing and Intestinal Parasites',
        baseline:
          'Fecal flotation every 6-12 months plus broad-spectrum prevention.',
        byRisk: {
          low: 'Fecal flotation every 12 months; monthly broad-spectrum prevention.',
          moderate:
            'Fecal flotation every 6 months; monthly broad-spectrum prevention.',
          high: 'Fecal flotation every 3-4 months; monthly prevention plus post-exposure checks.',
        },
        reminder:
          'Treat in-contact pets and repeat fecal test after positive cases.',
      },
      {
        focus: 'Heartworm',
        baseline: 'Year-round prevention with annual antigen testing.',
        byRisk: {
          low: 'Year-round prevention; antigen test every 12 months.',
          moderate:
            'Year-round prevention; antigen test every 12 months and after missed doses.',
          high: 'Strict year-round prevention; antigen test every 6-12 months in high mosquito areas.',
        },
        reminder:
          'Run confirmatory testing and microfilaria assessment if positive.',
      },
      {
        focus: 'Flea and Tick Control',
        baseline:
          'Continuous ectoparasite control with environmental management.',
        byRisk: {
          low: 'Monthly flea/tick control during risk season or year-round if climate supports vectors.',
          moderate: 'Monthly year-round flea/tick prevention.',
          high: 'Year-round prevention with strict adherence and frequent skin/tick checks.',
        },
        reminder:
          'Treat all household pets and clean bedding/environment to reduce reinfestation.',
      },
      {
        focus: 'Public Health and Zoonosis',
        baseline:
          'Routine hygiene, feces disposal, and family risk counseling.',
        byRisk: {
          low: 'Reinforce hand hygiene and routine stool disposal.',
          moderate:
            'Reinforce hygiene plus monthly reminder on child/immunocompromised safety.',
          high: 'Provide written zoonosis instructions and stricter feces disposal guidance.',
        },
        reminder:
          'Escalate counseling when households include children, seniors, or immunocompromised people.',
      },
    ],
    cat: [
      {
        focus: 'Fecal Testing and Intestinal Parasites',
        baseline:
          'Fecal testing every 6-12 months with monthly broad-spectrum prevention.',
        byRisk: {
          low: 'Fecal test every 12 months; monthly internal parasite prevention.',
          moderate: 'Fecal test every 6 months; monthly prevention.',
          high: 'Fecal test every 3-4 months; monthly prevention and targeted deworming after hunting exposure.',
        },
        reminder:
          'Outdoor and hunting cats need tighter interval checks for tapeworm and roundworm risk.',
      },
      {
        focus: 'Heartworm (Regional Risk)',
        baseline:
          'Use monthly prevention where vectors are present and test based on clinical suspicion.',
        byRisk: {
          low: 'Discuss prevention even for indoor cats in endemic regions.',
          moderate:
            'Monthly prevention during vector season or year-round based on local risk.',
          high: 'Year-round prevention in endemic areas with workup if respiratory or GI signs develop.',
        },
        reminder:
          'No single test excludes feline heartworm; combine history, imaging, and antigen/antibody context.',
      },
      {
        focus: 'Flea, Tick, and Mite Control',
        baseline:
          'Consistent ectoparasite prevention with household-level treatment.',
        byRisk: {
          low: 'Monthly flea prevention; reassess tick coverage by geography.',
          moderate: 'Monthly year-round flea/tick prevention.',
          high: 'Strict year-round flea/tick prevention plus regular coat checks.',
        },
        reminder:
          'Confirm products are feline-safe; avoid canine permethrin products.',
      },
      {
        focus: 'Public Health and Zoonosis',
        baseline: 'Litter hygiene and household handwashing counseling.',
        byRisk: {
          low: 'Daily litter disposal and hand hygiene reinforcement.',
          moderate:
            'Daily litter disposal plus routine zoonosis review during wellness visits.',
          high: 'Daily litter disposal with stricter counseling for pregnant or immunocompromised household members.',
        },
        reminder:
          'Review toxoplasmosis and hookworm precautions during preventive visits.',
      },
    ],
  }

  function byId(id) {
    return document.getElementById(id)
  }

  function setText(id, value) {
    var node = byId(id)
    if (node) {
      node.textContent = value || '-'
    }
  }

  function getCurrentSpecies() {
    var speciesSelect = byId('parasite-species')
    var value = speciesSelect ? String(speciesSelect.value || 'dog') : 'dog'
    return value === 'cat' ? 'cat' : 'dog'
  }

  function renderLifeStageOptions(species) {
    var select = byId('parasite-stage')
    if (!select) {
      return
    }

    var stages = LIFE_STAGES[species] || LIFE_STAGES.dog
    var previous = String(select.value || '')

    select.innerHTML = ''
    for (var i = 0; i < stages.length; i += 1) {
      var option = document.createElement('option')
      option.value = stages[i].id
      option.textContent = stages[i].label
      if (stages[i].id === previous) {
        option.selected = true
      }
      select.appendChild(option)
    }
  }

  function getCurrentStage(species) {
    var select = byId('parasite-stage')
    var stages = LIFE_STAGES[species] || LIFE_STAGES.dog
    var selected = select ? String(select.value || '') : ''

    for (var i = 0; i < stages.length; i += 1) {
      if (stages[i].id === selected) {
        return stages[i].id
      }
    }
    return stages[0].id
  }

  function getCurrentRisk() {
    var riskSelect = byId('parasite-risk')
    var risk = riskSelect ? String(riskSelect.value || 'moderate') : 'moderate'
    if (risk !== 'low' && risk !== 'moderate' && risk !== 'high') {
      return 'moderate'
    }
    return risk
  }

  function renderRows(species, risk) {
    var rows = byId('parasite-rows')
    if (!rows) {
      return
    }

    var data = PROTOCOLS[species] || PROTOCOLS.dog
    var html = ''

    for (var i = 0; i < data.length; i += 1) {
      html += '<tr>'
      html += '<td>' + data[i].focus + '</td>'
      html += '<td>' + data[i].baseline + '</td>'
      html += '<td>' + data[i].byRisk[risk] + '</td>'
      html += '<td>' + data[i].reminder + '</td>'
      html += '</tr>'
    }

    rows.innerHTML = html
  }

  function renderProtocol() {
    var species = getCurrentSpecies()
    var stage = getCurrentStage(species)
    var risk = getCurrentRisk()

    setText('parasite-stage-note', STAGE_NOTES[species][stage])
    renderRows(species, risk)
    setText(
      'parasite-note',
      'Protocol generated for ' +
        species.toUpperCase() +
        ' | ' +
        RISK_LABELS[risk] +
        '.'
    )
  }

  function copyProtocol() {
    var species = getCurrentSpecies()
    var stage = getCurrentStage(species)
    var risk = getCurrentRisk()
    var rows = PROTOCOLS[species] || PROTOCOLS.dog
    var lines = []

    lines.push('Parasite Control Reference')
    lines.push('Species: ' + species.toUpperCase())
    lines.push('Life Stage: ' + stage)
    lines.push('Risk Profile: ' + RISK_LABELS[risk])
    lines.push('Life Stage Priority: ' + STAGE_NOTES[species][stage])
    lines.push('')

    for (var i = 0; i < rows.length; i += 1) {
      lines.push(rows[i].focus + ': ' + rows[i].byRisk[risk])
      lines.push('Reminder: ' + rows[i].reminder)
    }

    lines.push('')
    lines.push(
      'Educational use only. Verify with local protocols and product labels.'
    )

    var output = lines.join('\n')
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      navigator.clipboard.writeText(output)
      setText('parasite-note', 'Protocol copied to clipboard.')
      return
    }

    var helper = document.createElement('textarea')
    helper.value = output
    helper.setAttribute('readonly', 'readonly')
    helper.style.position = 'absolute'
    helper.style.left = '-9999px'
    document.body.appendChild(helper)
    helper.select()
    document.execCommand('copy')
    document.body.removeChild(helper)
    setText('parasite-note', 'Protocol copied to clipboard.')
  }

  function init() {
    var form = byId('parasite-form')
    var speciesSelect = byId('parasite-species')
    var stageSelect = byId('parasite-stage')
    var riskSelect = byId('parasite-risk')
    var copyButton = byId('parasite-copy')

    if (!form || !speciesSelect || !stageSelect || !riskSelect || !copyButton) {
      return
    }

    renderLifeStageOptions(getCurrentSpecies())
    renderProtocol()

    speciesSelect.addEventListener('change', function () {
      renderLifeStageOptions(getCurrentSpecies())
      renderProtocol()
    })

    stageSelect.addEventListener('change', renderProtocol)
    riskSelect.addEventListener('change', renderProtocol)

    form.addEventListener('submit', function (event) {
      event.preventDefault()
      renderProtocol()
    })

    copyButton.addEventListener('click', copyProtocol)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
