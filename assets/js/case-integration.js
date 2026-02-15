;(function () {
  'use strict'

  var CASE_CONFIG = {
    'dka-dog.html': {
      caseId: 'dka_canine_001',
      title: 'Canine Diabetic Ketoacidosis',
      patient: {
        species: 'canine',
        weightKg: 28,
        dehydrationPercent: 8,
      },
      decisionPoints: [
        'Step 1: Confirm fluid deficit and first-hour fluid target.',
        'Step 2: Start insulin only after initial fluid stabilization.',
        'Step 3: Recheck BG and electrolytes every 2-4 hours.',
      ],
      tools: [
        {
          id: 'fluid_calculator',
          label: 'Fluid Calculator',
          href: '/tools/fluid-calculator.html',
          summary: 'Preloaded for this 28 kg patient with 8% dehydration.',
          params: { weight: 28, dehydration: 8, maintenance: 60, auto: 1 },
        },
        {
          id: 'insulin_cri',
          label: 'Insulin CRI Planner',
          href: '/tools/insulin-cri-planner.html',
          summary: 'Prefilled insulin CRI baseline for DKA workflow.',
          params: {
            weight: 28,
            dose: 0.08,
            bag: 250,
            units: 2.5,
            bg: 450,
            auto: 1,
          },
        },
        {
          id: 'acid_base',
          label: 'Acid-Base Electrolyte Tool',
          href: '/tools/acid-base-electrolyte.html',
          summary:
            'Use this after initial stabilization to interpret derangements.',
          params: {},
        },
        {
          id: 'potassium_planner',
          label: 'Electrolyte Replacement Planner',
          href: '/tools/electrolyte-replacement-planner.html',
          summary: 'Plan potassium/phosphorus support alongside insulin.',
          params: {},
        },
      ],
      assessment: {
        passScorePercent: 80,
        items: [
          {
            id: 'fluid_deficit',
            step: 1,
            label: 'Fluid deficit',
            prompt:
              'Calculate dehydration deficit for a 28 kg dog at 8% dehydration.',
            expected: 2.24,
            tolerance: 0.1,
            weight: 40,
            unit: 'L',
            triggerTool: 'fluid_calculator',
            teachablePoint:
              'Deficit (L) = body weight (kg) x dehydration fraction.',
          },
          {
            id: 'insulin_rate',
            step: 2,
            label: 'Insulin infusion rate',
            prompt:
              'At 0.08 U/kg/hr for 28 kg, what is the required insulin rate?',
            expected: 2.24,
            tolerance: 0.1,
            weight: 35,
            unit: 'U/hr',
            triggerTool: 'insulin_cri',
            teachablePoint:
              'Insulin starts after initial fluid stabilization in DKA.',
          },
          {
            id: 'monitoring_frequency',
            step: 3,
            label: 'Monitoring interval',
            prompt:
              'Choose a typical early recheck interval for BG/electrolytes.',
            expected: 3,
            tolerance: 1,
            weight: 25,
            unit: 'hours',
            triggerTool: 'potassium_planner',
            teachablePoint:
              'Frequent rechecks prevent iatrogenic shifts during stabilization.',
          },
        ],
      },
    },
    'chf-dog.html': {
      caseId: 'chf_canine_001',
      title: 'Canine Congestive Heart Failure',
      patient: {
        species: 'canine',
        weightKg: 33,
      },
      decisionPoints: [
        'Step 1: Confirm cardiogenic pattern versus primary respiratory disease.',
        'Step 2: Estimate immediate congestion severity and stage pattern.',
        'Step 3: Define recheck interval based on response and risk.',
      ],
      tools: [
        {
          id: 'chf_stage',
          label: 'CHF Staging Planner',
          href: '/tools/chf-staging-planner.html',
          summary: 'Preloaded with symptomatic CHF-compatible findings.',
          params: { signs: 1, edema: 1, remodeling: 1, auto: 1 },
        },
        {
          id: 'emergency_chart',
          label: 'Emergency Drug Chart',
          href: '/tools/emergency-drug-chart.html',
          summary: 'Cardiopulmonary emergency references for clinic use.',
          params: {},
        },
        {
          id: 'sepsis_bundle',
          label: 'Sepsis Bundle Planner',
          href: '/tools/sepsis-bundle-planner.html',
          summary:
            'Rule-in/rule-out systemic instability in dyspneic patients.',
          params: {},
        },
      ],
      assessment: {
        passScorePercent: 80,
        items: [
          {
            id: 'chf_initial_test',
            step: 1,
            label: 'Initial diagnostic priority',
            prompt:
              'Which test is the most appropriate next step to confirm active CHF pattern?',
            inputType: 'choice',
            choices: [
              { id: 'radiographs', label: 'Thoracic radiographs' },
              { id: 'echocardiogram', label: 'Echocardiogram with Doppler' },
              { id: 'ntprobnp', label: 'NT-proBNP blood test' },
            ],
            expectedChoice: 'radiographs',
            weight: 40,
            triggerTool: 'chf_stage',
            teachablePoint:
              'Radiographs confirm congestion pattern before deeper structural workup.',
          },
          {
            id: 'chf_stage_pattern',
            step: 2,
            label: 'Likely stage classification',
            prompt:
              'When signs and pulmonary edema are present, which stage pattern is most likely?',
            inputType: 'choice',
            choices: [
              { id: 'stage_c', label: 'Stage C pattern' },
              { id: 'stage_b2', label: 'Stage B2 pattern' },
              { id: 'indeterminate', label: 'Early/indeterminate pattern' },
            ],
            expectedChoice: 'stage_c',
            weight: 35,
            triggerTool: 'chf_stage',
            teachablePoint:
              'Symptomatic congestive signs align with stage C pattern logic.',
          },
          {
            id: 'chf_recheck_days',
            step: 3,
            label: 'Early recheck timing',
            prompt:
              'Enter a typical recheck window in days after stabilization.',
            expected: 5,
            tolerance: 2,
            weight: 25,
            unit: 'days',
            triggerTool: 'chf_stage',
            teachablePoint:
              'Early rechecks refine dose response and perfusion/renal safety.',
          },
        ],
      },
    },
    'feline-hyperthyroid.html': {
      caseId: 'hyperthyroid_feline_001',
      title: 'Feline Hyperthyroidism',
      patient: {
        species: 'feline',
        weightKg: 4.2,
      },
      decisionPoints: [
        'Step 1: Confirm endocrine diagnosis and baseline risk profile.',
        'Step 2: Track body condition and nutritional recovery targets.',
        'Step 3: Monitor blood pressure and systemic consequences.',
      ],
      tools: [
        {
          id: 'nutrition',
          label: 'Nutrition RER/MER Calculator',
          href: '/tools/nutrition-rer-mer-calculator.html',
          summary: 'Estimate intake targets during endocrine stabilization.',
          params: {},
        },
        {
          id: 'normal_values',
          label: 'Normal Lab Values',
          href: '/reference/normal-values.html',
          summary: 'Quick lab baseline context for interpretation.',
          params: {},
        },
        {
          id: 'topic_guide',
          label: 'Hypertension Target Organ Damage Guide',
          href: '/systemic-hypertension-target-organ-damage/',
          summary: 'Case-linked study guide for cardiovascular complications.',
          params: {},
        },
      ],
      assessment: {
        passScorePercent: 80,
        items: [
          {
            id: 'hyper_confirm_test',
            step: 1,
            label: 'Confirmatory test',
            prompt:
              'Which first-line confirmatory test is highest yield in this typical case?',
            inputType: 'choice',
            choices: [
              { id: 'total_t4', label: 'Total T4 concentration' },
              { id: 't3_suppress', label: 'T3 suppression test' },
              { id: 'scintigraphy', label: 'Thyroid scintigraphy' },
            ],
            expectedChoice: 'total_t4',
            weight: 40,
            triggerTool: 'normal_values',
            teachablePoint:
              'Total T4 is confirmatory in most classic feline presentations.',
          },
          {
            id: 'hyper_hr_case',
            step: 2,
            label: 'Case heart-rate anchor',
            prompt:
              'Enter the approximate resting heart rate from this case findings.',
            expected: 220,
            tolerance: 20,
            weight: 30,
            unit: 'bpm',
            triggerTool: 'topic_guide',
            teachablePoint:
              'Tachycardia severity supports endocrine-cardiovascular risk prioritization.',
          },
          {
            id: 'hyper_monitor_priority',
            step: 3,
            label: 'Monitoring priority',
            prompt:
              'Which follow-up priority is emphasized early in this case?',
            inputType: 'choice',
            choices: [
              { id: 'bp_retina', label: 'Blood pressure and retinal status' },
              { id: 'derm_only', label: 'Coat quality only' },
              { id: 'fecal_only', label: 'Fecal trend only' },
            ],
            expectedChoice: 'bp_retina',
            weight: 30,
            triggerTool: 'topic_guide',
            teachablePoint:
              'Hypertension surveillance is a key early safety checkpoint.',
          },
        ],
      },
    },
    'bovine-mastitis.html': {
      caseId: 'mastitis_bovine_001',
      title: 'Bovine Clinical Mastitis',
      patient: {
        species: 'bovine',
      },
      decisionPoints: [
        'Step 1: Confirm quarter-level diagnosis and severity.',
        'Step 2: Collect sterile milk sample before final antimicrobial choice.',
        'Step 3: Align individual treatment with herd-level prevention.',
      ],
      tools: [
        {
          id: 'unit_converter',
          label: 'Unit Converter',
          href: '/tools/unit-converter.html',
          summary: 'Convert concentrations and dosing units rapidly.',
          params: {},
        },
        {
          id: 'discharge',
          label: 'Discharge Generator',
          href: '/tools/discharge-generator.html',
          summary: 'Create owner communication and follow-up structure.',
          params: {},
        },
        {
          id: 'lab_protocols',
          label: 'Lab Interpretation Caveats',
          href: '/lab-interpretation-caveats/',
          summary:
            'Reference interpretation pitfalls while awaiting culture data.',
          params: {},
        },
      ],
      assessment: {
        passScorePercent: 80,
        items: [
          {
            id: 'mastitis_sample',
            step: 1,
            label: 'Best diagnostic sample',
            prompt:
              'What is the most appropriate first diagnostic sample in this case?',
            inputType: 'choice',
            choices: [
              {
                id: 'sterile_milk',
                label: 'Sterile milk culture from affected quarter',
              },
              { id: 'blood_culture', label: 'Blood culture' },
              { id: 'ultrasound_only', label: 'Ultrasound imaging only' },
            ],
            expectedChoice: 'sterile_milk',
            weight: 40,
            triggerTool: 'lab_protocols',
            teachablePoint:
              'Quarter-level sterile culture drives targeted therapy decisions.',
          },
          {
            id: 'mastitis_temp',
            step: 2,
            label: 'Case temperature anchor',
            prompt: 'Enter the temperature documented in this case.',
            expected: 39.8,
            tolerance: 0.3,
            weight: 30,
            unit: 'C',
            triggerTool: 'unit_converter',
            teachablePoint:
              'Pyrexia severity helps frame local versus systemic burden.',
          },
          {
            id: 'mastitis_herd_factor',
            step: 3,
            label: 'Herd-level risk factor',
            prompt:
              'Which management factor is flagged as part of recurrence risk?',
            inputType: 'choice',
            choices: [
              {
                id: 'wet_bedding',
                label: 'Wet bedding and variable teat hygiene',
              },
              { id: 'high_fiber_only', label: 'High-fiber ration only' },
              { id: 'exercise_shortage', label: 'Low paddock exercise only' },
            ],
            expectedChoice: 'wet_bedding',
            weight: 30,
            triggerTool: 'discharge',
            teachablePoint:
              'Environmental hygiene correction is core to durable control.',
          },
        ],
      },
    },
  }

  function getPageKey() {
    var path = window.location.pathname || ''
    var parts = path.split('/')
    return parts.length ? parts[parts.length - 1] : ''
  }

  function getConfig() {
    return CASE_CONFIG[getPageKey()] || null
  }

  function toNumber(value) {
    var parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : NaN
  }

  function formatResolutionLabel(value) {
    var normalized = String(value || '')
      .trim()
      .toLowerCase()
    if (!normalized) {
      return ''
    }
    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }

  function parseComplicationsInput(value) {
    return String(value || '')
      .split(',')
      .map(function (item) {
        return String(item || '').trim()
      })
      .filter(function (item) {
        return !!item
      })
  }

  function renderStats(encounterId, node) {
    if (
      !node ||
      !window.pcIntegration ||
      typeof window.pcIntegration.getEncounter !== 'function'
    ) {
      return
    }

    var encounter = window.pcIntegration.getEncounter(encounterId)
    if (!encounter) {
      node.textContent = 'Encounter not found.'
      return
    }

    var calcCount = Array.isArray(encounter.calculations)
      ? encounter.calculations.length
      : 0
    var eventCount = Array.isArray(encounter.events)
      ? encounter.events.length
      : 0
    var outcomes =
      encounter.outcomes && typeof encounter.outcomes === 'object'
        ? encounter.outcomes
        : {}
    var outcomeSummary = outcomes.resolution
      ? ' Outcome: ' +
        formatResolutionLabel(outcomes.resolution) +
        (outcomes.followUpNeeded ? ' (follow-up required).' : '.')
      : ' Outcome: not documented.'

    node.textContent =
      'Encounter log: ' +
      calcCount +
      ' calculations and ' +
      eventCount +
      ' timeline events captured.' +
      outcomeSummary
  }

  function getToolById(config, toolId) {
    if (!config || !Array.isArray(config.tools) || !toolId) {
      return null
    }

    var normalized = String(toolId)
    var i
    for (i = 0; i < config.tools.length; i += 1) {
      if (config.tools[i] && config.tools[i].id === normalized) {
        return config.tools[i]
      }
    }

    return null
  }

  function getToolHref(config, encounter, toolId) {
    var tool = getToolById(config, toolId)
    if (!tool) {
      return ''
    }

    if (
      window.pcIntegration &&
      typeof window.pcIntegration.buildPrefillUrl === 'function'
    ) {
      return window.pcIntegration.buildPrefillUrl(
        tool.href,
        tool.params || {},
        {
          caseId: config.caseId,
          encounterId: encounter.id,
        }
      )
    }

    return tool.href
  }

  function calculateAssessmentScore(items, answers) {
    var rubricItems = Array.isArray(items) ? items : []
    var answerMap = answers && typeof answers === 'object' ? answers : {}
    var weightedTotal = 0
    var weightedEarned = 0
    var completedSteps = 0
    var i

    for (i = 0; i < rubricItems.length; i += 1) {
      var item = rubricItems[i]
      var weight = Number.isFinite(Number(item.weight))
        ? Number(item.weight)
        : 0
      weightedTotal += weight

      if (!answerMap[item.id]) {
        continue
      }

      completedSteps += 1
      if (answerMap[item.id].isCorrect) {
        weightedEarned += weight
      }
    }

    var percent =
      weightedTotal > 0 ? Math.round((weightedEarned / weightedTotal) * 100) : 0
    return {
      earned: weightedEarned,
      total: weightedTotal,
      percent: percent,
      completed: completedSteps,
      stepCount: rubricItems.length,
    }
  }

  function createAssessmentCard(config, encounter, onScoreUpdate) {
    var assessment =
      config && config.assessment && typeof config.assessment === 'object'
        ? config.assessment
        : null
    var items =
      assessment && Array.isArray(assessment.items) ? assessment.items : []

    if (!items.length) {
      return null
    }

    var passScore = Number.isFinite(Number(assessment.passScorePercent))
      ? Number(assessment.passScorePercent)
      : 80
    var answers = {}

    var card = document.createElement('article')
    card.className = 'pc-tool-module pc-case-assessment'
    card.innerHTML = '<h3>Teachable Moment Skill Check</h3>'

    var intro = document.createElement('p')
    intro.className = 'pc-case-intel__summary'
    intro.textContent =
      'Validate each step in sequence. A step unlocks when the answer is correct or within tolerance.'
    card.appendChild(intro)

    var status = document.createElement('p')
    status.className = 'pc-case-assessment__score'
    card.appendChild(status)

    var stepsWrap = document.createElement('div')
    stepsWrap.className = 'pc-case-assessment__steps'
    card.appendChild(stepsWrap)

    function updateStatus(lastAttempt) {
      var score = calculateAssessmentScore(items, answers)
      var passState = score.percent >= passScore ? 'Pass' : 'In progress'
      var suffix = ''

      if (score.completed === score.stepCount) {
        passState = score.percent >= passScore ? 'Pass' : 'Needs review'
      }

      if (lastAttempt && lastAttempt.id) {
        suffix =
          ' | Last step: ' +
          lastAttempt.id +
          ' (' +
          (lastAttempt.isCorrect ? 'correct' : 'retry') +
          ')'
      }

      status.textContent =
        'Score: ' +
        score.percent +
        '% (' +
        score.earned +
        '/' +
        score.total +
        ' weighted points) | ' +
        score.completed +
        '/' +
        score.stepCount +
        ' steps attempted | ' +
        passState +
        suffix

      status.classList.remove('pc-case-assessment__score--pass')
      status.classList.remove('pc-case-assessment__score--review')
      if (score.percent >= passScore) {
        status.classList.add('pc-case-assessment__score--pass')
      } else if (score.completed === score.stepCount) {
        status.classList.add('pc-case-assessment__score--review')
      }

      if (typeof onScoreUpdate === 'function') {
        onScoreUpdate(score)
      }
    }

    function setLocked(row, isLocked) {
      var input = row.querySelector('input, select')
      var button = row.querySelector('button')
      row.classList.toggle('pc-case-step--locked', !!isLocked)

      if (input) {
        input.disabled = !!isLocked
      }
      if (button) {
        button.disabled = !!isLocked
      }
    }

    function unlockStep(index) {
      var rows = stepsWrap.querySelectorAll('[data-step-row]')
      if (!rows[index]) {
        return
      }
      setLocked(rows[index], false)
    }

    var i
    for (i = 0; i < items.length; i += 1) {
      ;(function (item, index) {
        var row = document.createElement('div')
        row.className = 'pc-case-step'
        row.setAttribute('data-step-row', item.id)
        var itemInputType = String(item.inputType || 'number')
          .trim()
          .toLowerCase()

        var stepTitle = document.createElement('p')
        stepTitle.className = 'pc-case-step__title'
        stepTitle.textContent =
          'Step ' +
          (item.step || index + 1) +
          ': ' +
          item.label +
          ' (' +
          item.weight +
          ' pts)'
        row.appendChild(stepTitle)

        var prompt = document.createElement('p')
        prompt.className = 'pc-case-step__prompt'
        prompt.textContent = item.prompt
        row.appendChild(prompt)

        var teachable = document.createElement('p')
        teachable.className = 'pc-case-step__teachable'
        teachable.textContent = item.teachablePoint || ''
        row.appendChild(teachable)

        var controls = document.createElement('div')
        controls.className = 'pc-case-step__controls'

        var input
        if (
          itemInputType === 'choice' &&
          Array.isArray(item.choices) &&
          item.choices.length
        ) {
          input = document.createElement('select')
          input.className = 'pc-input'

          var defaultOption = document.createElement('option')
          defaultOption.value = ''
          defaultOption.textContent = 'Select an option'
          input.appendChild(defaultOption)

          var optionIndex
          for (
            optionIndex = 0;
            optionIndex < item.choices.length;
            optionIndex += 1
          ) {
            var choice = item.choices[optionIndex] || {}
            var option = document.createElement('option')
            option.value = String(choice.id || '')
            option.textContent = String(choice.label || choice.id || '')
            input.appendChild(option)
          }
        } else {
          input = document.createElement('input')
          input.className = 'pc-input'
          input.type = 'number'
          input.step = 'any'
          input.placeholder =
            'Expected near ' +
            item.expected +
            (item.unit ? ' ' + item.unit : '')
        }
        controls.appendChild(input)

        var button = document.createElement('button')
        button.type = 'button'
        button.className = 'pc-btn pc-btn--secondary'
        button.textContent = 'Validate Step'
        controls.appendChild(button)

        if (item.triggerTool) {
          var launch = document.createElement('a')
          launch.className = 'pc-link-chip pc-link-chip--muted'
          launch.textContent = 'Open linked tool'
          launch.href = getToolHref(config, encounter, item.triggerTool) || '#'
          controls.appendChild(launch)
        }

        row.appendChild(controls)

        var feedback = document.createElement('p')
        feedback.className = 'pc-case-step__feedback'
        row.appendChild(feedback)

        if (index > 0) {
          setLocked(row, true)
        }

        button.addEventListener('click', function () {
          var isCorrect = false
          var enteredValue = ''
          var expectedValue = ''
          var tolerance = null
          var feedbackMessage = ''
          var choiceLabel = ''

          if (itemInputType === 'choice') {
            enteredValue = String(input.value || '').trim()
            expectedValue = String(item.expectedChoice || '').trim()

            if (!enteredValue) {
              feedback.textContent = 'Select one option before validating.'
              feedback.classList.remove('pc-case-step__feedback--ok')
              feedback.classList.add('pc-case-step__feedback--warn')
              return
            }

            isCorrect = enteredValue === expectedValue

            var cIndex
            for (
              cIndex = 0;
              cIndex < (item.choices || []).length;
              cIndex += 1
            ) {
              if (String(item.choices[cIndex].id || '') === expectedValue) {
                choiceLabel = String(
                  item.choices[cIndex].label || expectedValue
                )
                break
              }
            }

            feedbackMessage = isCorrect
              ? 'Correct selection.'
              : 'Not the best selection. Expected: ' +
                (choiceLabel || expectedValue) +
                '.'

            answers[item.id] = {
              selectedChoice: enteredValue,
              expectedChoice: expectedValue,
              isCorrect: isCorrect,
              attemptedAt: new Date().toISOString(),
            }
          } else {
            var value = toNumber(input.value)
            if (!Number.isFinite(value)) {
              feedback.textContent = 'Enter a numeric value before validating.'
              feedback.classList.remove('pc-case-step__feedback--ok')
              feedback.classList.add('pc-case-step__feedback--warn')
              return
            }

            tolerance = Number.isFinite(Number(item.tolerance))
              ? Number(item.tolerance)
              : 0
            var diff = Math.abs(value - item.expected)
            isCorrect = diff <= tolerance
            enteredValue = value
            expectedValue = item.expected

            feedbackMessage = isCorrect
              ? 'Correct within tolerance. Diff: ' +
                diff.toFixed(2) +
                (item.unit ? ' ' + item.unit : '') +
                '.'
              : 'Outside tolerance. Expected ~' +
                item.expected +
                (item.unit ? ' ' + item.unit : '') +
                ' (±' +
                tolerance +
                ').'

            answers[item.id] = {
              value: value,
              expected: item.expected,
              tolerance: tolerance,
              isCorrect: isCorrect,
              attemptedAt: new Date().toISOString(),
            }
          }

          row.classList.remove('pc-case-step--correct')
          row.classList.remove('pc-case-step--retry')
          feedback.classList.remove('pc-case-step__feedback--ok')
          feedback.classList.remove('pc-case-step__feedback--warn')

          if (isCorrect) {
            row.classList.add('pc-case-step--correct')
            feedback.classList.add('pc-case-step__feedback--ok')
            feedback.textContent = feedbackMessage
            unlockStep(index + 1)
          } else {
            row.classList.add('pc-case-step--retry')
            feedback.classList.add('pc-case-step__feedback--warn')
            feedback.textContent = feedbackMessage
          }

          updateStatus({
            id: item.id,
            isCorrect: isCorrect,
          })

          if (
            window.pcIntegration &&
            typeof window.pcIntegration.logCaseAction === 'function'
          ) {
            var score = calculateAssessmentScore(items, answers)
            window.pcIntegration.logCaseAction({
              encounterId: encounter.id,
              caseId: config.caseId,
              caseTitle: config.title,
              action: 'skill_check_validate',
              source: 'case_skill_check',
              details: {
                stepId: item.id,
                stepLabel: item.label,
                inputType: itemInputType,
                entered: enteredValue,
                expected: expectedValue,
                tolerance: tolerance,
                withinTolerance: isCorrect,
                scorePercent: score.percent,
              },
            })
          }
        })

        stepsWrap.appendChild(row)
      })(items[i], i)
    }

    updateStatus()
    return card
  }

  function createOutcomeCard(config, encounter, onOutcomeSaved) {
    var card = document.createElement('article')
    card.className = 'pc-tool-module pc-case-outcome'
    card.innerHTML = '<h3>Clinical Outcome Snapshot</h3>'

    var intro = document.createElement('p')
    intro.className = 'pc-case-intel__summary'
    intro.textContent =
      'Capture treatment summary and outcome to keep case and calculator history linked.'
    card.appendChild(intro)

    var grid = document.createElement('div')
    grid.className = 'pc-case-outcome__grid'

    var treatmentField = document.createElement('label')
    treatmentField.className = 'pc-case-outcome__field'
    treatmentField.innerHTML = '<span>Actual treatment</span>'
    var treatmentInput = document.createElement('textarea')
    treatmentInput.className = 'pc-input pc-case-outcome__text'
    treatmentInput.rows = 3
    treatmentInput.placeholder =
      'e.g., Fluid stabilization, insulin CRI, potassium support'
    treatmentField.appendChild(treatmentInput)
    grid.appendChild(treatmentField)

    var complicationsField = document.createElement('label')
    complicationsField.className = 'pc-case-outcome__field'
    complicationsField.innerHTML =
      '<span>Complications (comma separated)</span>'
    var complicationsInput = document.createElement('input')
    complicationsInput.className = 'pc-input'
    complicationsInput.type = 'text'
    complicationsInput.placeholder = 'e.g., hypokalemia, recurrent vomiting'
    complicationsField.appendChild(complicationsInput)
    grid.appendChild(complicationsField)

    var resolutionField = document.createElement('label')
    resolutionField.className = 'pc-case-outcome__field'
    resolutionField.innerHTML = '<span>Resolution</span>'
    var resolutionSelect = document.createElement('select')
    resolutionSelect.className = 'pc-input'
    resolutionSelect.innerHTML =
      '<option value="">Select</option>' +
      '<option value="improved">Improved</option>' +
      '<option value="static">Static</option>' +
      '<option value="deteriorated">Deteriorated</option>' +
      '<option value="euthanized">Euthanized</option>'
    resolutionField.appendChild(resolutionSelect)
    grid.appendChild(resolutionField)

    var followUpField = document.createElement('label')
    followUpField.className = 'pc-case-outcome__check'
    var followUpInput = document.createElement('input')
    followUpInput.type = 'checkbox'
    followUpField.appendChild(followUpInput)
    followUpField.appendChild(document.createTextNode('Follow-up required'))
    grid.appendChild(followUpField)

    card.appendChild(grid)

    var actions = document.createElement('div')
    actions.className = 'pc-panel-actions'
    var saveButton = document.createElement('button')
    saveButton.type = 'button'
    saveButton.className = 'pc-btn pc-btn--secondary'
    saveButton.textContent = 'Save Outcome Snapshot'
    actions.appendChild(saveButton)
    card.appendChild(actions)

    var status = document.createElement('p')
    status.className = 'pc-case-outcome__status'
    status.textContent = 'No outcome snapshot saved yet.'
    card.appendChild(status)

    function loadExistingOutcome() {
      if (
        !window.pcIntegration ||
        typeof window.pcIntegration.getEncounter !== 'function'
      ) {
        return
      }

      var current = window.pcIntegration.getEncounter(encounter.id)
      var outcomes =
        current && current.outcomes && typeof current.outcomes === 'object'
          ? current.outcomes
          : null
      if (!outcomes) {
        return
      }

      treatmentInput.value = String(outcomes.actualTreatment || '')
      complicationsInput.value = Array.isArray(outcomes.complications)
        ? outcomes.complications.join(', ')
        : ''
      resolutionSelect.value = String(outcomes.resolution || '')
      followUpInput.checked = !!outcomes.followUpNeeded

      if (outcomes.updatedAt) {
        status.textContent =
          'Loaded previous snapshot (' +
          new Date(outcomes.updatedAt).toLocaleString() +
          ').'
      }
    }

    saveButton.addEventListener('click', function () {
      if (
        !window.pcIntegration ||
        typeof window.pcIntegration.updateEncounterOutcome !== 'function'
      ) {
        status.textContent = 'Outcome save is unavailable in this environment.'
        return
      }

      var payload = {
        actualTreatment: treatmentInput.value,
        complications: parseComplicationsInput(complicationsInput.value),
        resolution: resolutionSelect.value,
        followUpNeeded: !!followUpInput.checked,
      }

      var response = window.pcIntegration.updateEncounterOutcome({
        encounterId: encounter.id,
        caseId: config.caseId,
        caseTitle: config.title,
        outcomes: payload,
      })

      if (!response || !response.ok) {
        status.textContent = 'Failed to save outcome snapshot.'
        return
      }

      var resolved =
        response.outcomes && response.outcomes.resolution
          ? formatResolutionLabel(response.outcomes.resolution)
          : 'not set'
      status.textContent =
        'Outcome saved. Resolution: ' +
        resolved +
        (response.outcomes.followUpNeeded
          ? ' | follow-up required.'
          : ' | no follow-up flagged.')

      if (
        window.pcIntegration &&
        typeof window.pcIntegration.logCaseAction === 'function'
      ) {
        window.pcIntegration.logCaseAction({
          encounterId: encounter.id,
          caseId: config.caseId,
          caseTitle: config.title,
          action: 'outcome_snapshot_saved',
          source: 'case_outcome_card',
          details: {
            resolution: response.outcomes.resolution || '',
            followUpNeeded: !!response.outcomes.followUpNeeded,
            complicationCount: Array.isArray(response.outcomes.complications)
              ? response.outcomes.complications.length
              : 0,
          },
        })
      }

      if (typeof onOutcomeSaved === 'function') {
        onOutcomeSaved(response.outcomes)
      }
    })

    loadExistingOutcome()
    return card
  }

  function buildHandoffText(encounterData) {
    var encounter =
      encounterData && typeof encounterData === 'object' ? encounterData : {}
    var outcomes =
      encounter.outcomes && typeof encounter.outcomes === 'object'
        ? encounter.outcomes
        : {}
    var calculations = Array.isArray(encounter.calculations)
      ? encounter.calculations
      : []
    var maxRows = Math.min(calculations.length, 5)
    var lines = []
    var i

    lines.push('Encounter ID: ' + (encounter.id || ''))
    lines.push('Case: ' + (encounter.caseTitle || encounter.caseId || ''))
    lines.push('Status: ' + (encounter.status || 'open'))
    lines.push('Updated: ' + (encounter.updatedAt || ''))
    lines.push('Outcome: ' + (outcomes.resolution || 'not documented'))
    lines.push('Follow-up needed: ' + (outcomes.followUpNeeded ? 'yes' : 'no'))
    lines.push(
      'Complications: ' +
        (Array.isArray(outcomes.complications) && outcomes.complications.length
          ? outcomes.complications.join('; ')
          : 'none listed')
    )
    lines.push(
      'Actual treatment: ' + (outcomes.actualTreatment || 'not documented')
    )
    lines.push('Recent calculator activity:')

    if (!maxRows) {
      lines.push('- none')
    } else {
      for (i = calculations.length - maxRows; i < calculations.length; i += 1) {
        var calc = calculations[i] || {}
        lines.push(
          '- ' +
            (calc.calculatorLabel || calc.calculatorId || 'calculator') +
            ' @ ' +
            (calc.createdAt || '')
        )
      }
    }

    lines.push('Generated from VetLudics collaboration card.')
    return lines.join('\n')
  }

  function copyTextToClipboard(text) {
    var value = String(text || '')
    if (!value) {
      return Promise.resolve(false)
    }

    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      return navigator.clipboard
        .writeText(value)
        .then(function () {
          return true
        })
        .catch(function () {
          return false
        })
    }

    var area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', 'readonly')
    area.style.position = 'fixed'
    area.style.top = '-9999px'
    document.body.appendChild(area)
    area.select()
    var ok = false
    try {
      ok = document.execCommand('copy')
    } catch (error) {
      ok = false
    }
    document.body.removeChild(area)
    return Promise.resolve(ok)
  }

  function createCollaborationCard(config, encounter, onShared) {
    var card = document.createElement('article')
    card.className = 'pc-tool-module pc-case-collab'
    card.innerHTML = '<h3>Collaboration</h3>'

    var intro = document.createElement('p')
    intro.className = 'pc-case-intel__summary'
    intro.textContent =
      'Create share links for team review and generate handoff text for shift transitions.'
    card.appendChild(intro)

    var grid = document.createElement('div')
    grid.className = 'pc-case-outcome__grid'

    var permField = document.createElement('label')
    permField.className = 'pc-case-outcome__field'
    permField.innerHTML = '<span>Permission</span>'
    var permSelect = document.createElement('select')
    permSelect.className = 'pc-input'
    permSelect.innerHTML =
      '<option value="view_only">View only</option>' +
      '<option value="comment">Comment</option>' +
      '<option value="edit">Edit</option>'
    permField.appendChild(permSelect)
    grid.appendChild(permField)

    var expiryField = document.createElement('label')
    expiryField.className = 'pc-case-outcome__field'
    expiryField.innerHTML = '<span>Expiry</span>'
    var expirySelect = document.createElement('select')
    expirySelect.className = 'pc-input'
    expirySelect.innerHTML =
      '<option value="1_hour">1 hour</option>' +
      '<option value="24_hours">24 hours</option>' +
      '<option value="case_duration">Case duration</option>'
    expiryField.appendChild(expirySelect)
    grid.appendChild(expiryField)

    card.appendChild(grid)

    var actions = document.createElement('div')
    actions.className = 'pc-panel-actions'

    var shareButton = document.createElement('button')
    shareButton.type = 'button'
    shareButton.className = 'pc-btn pc-btn--secondary'
    shareButton.textContent = 'Copy Share Link'
    actions.appendChild(shareButton)

    var handoffButton = document.createElement('button')
    handoffButton.type = 'button'
    handoffButton.className = 'pc-btn pc-btn--secondary'
    handoffButton.textContent = 'Copy Handoff Summary'
    actions.appendChild(handoffButton)

    card.appendChild(actions)

    var status = document.createElement('p')
    status.className = 'pc-case-outcome__status'
    status.textContent = 'No collaboration action taken yet.'
    card.appendChild(status)

    function resolveShareLink() {
      var params = {
        collab: '1',
        perm: permSelect.value,
        exp: expirySelect.value,
      }

      var path = window.location.pathname || '/'
      if (
        window.pcIntegration &&
        typeof window.pcIntegration.buildPrefillUrl === 'function'
      ) {
        return (
          window.location.origin +
          window.pcIntegration.buildPrefillUrl(path, params, {
            caseId: config.caseId,
            encounterId: encounter.id,
          })
        )
      }

      var direct = new URL(path, window.location.origin)
      direct.searchParams.set('case', config.caseId)
      direct.searchParams.set('encounter', encounter.id)
      direct.searchParams.set('collab', '1')
      direct.searchParams.set('perm', permSelect.value)
      direct.searchParams.set('exp', expirySelect.value)
      return direct.toString()
    }

    shareButton.addEventListener('click', function () {
      var link = resolveShareLink()
      copyTextToClipboard(link).then(function (copied) {
        if (copied) {
          status.textContent =
            'Share link copied (' +
            permSelect.value +
            ', ' +
            expirySelect.value +
            ').'
        } else {
          status.textContent = 'Clipboard blocked. Share link: ' + link
        }

        if (
          window.pcIntegration &&
          typeof window.pcIntegration.logCaseAction === 'function'
        ) {
          window.pcIntegration.logCaseAction({
            encounterId: encounter.id,
            caseId: config.caseId,
            caseTitle: config.title,
            action: 'encounter_shared',
            source: 'case_collaboration',
            details: {
              permission: permSelect.value,
              expiry: expirySelect.value,
            },
          })
        }

        if (typeof onShared === 'function') {
          onShared()
        }
      })
    })

    handoffButton.addEventListener('click', function () {
      var currentEncounter =
        window.pcIntegration &&
        typeof window.pcIntegration.getEncounter === 'function'
          ? window.pcIntegration.getEncounter(encounter.id)
          : encounter
      var handoffText = buildHandoffText(currentEncounter)

      copyTextToClipboard(handoffText).then(function (copied) {
        status.textContent = copied
          ? 'Handoff summary copied for shift transition.'
          : 'Clipboard blocked. Handoff summary generated but not copied.'

        if (
          window.pcIntegration &&
          typeof window.pcIntegration.logCaseAction === 'function'
        ) {
          window.pcIntegration.logCaseAction({
            encounterId: encounter.id,
            caseId: config.caseId,
            caseTitle: config.title,
            action: 'handoff_summary_generated',
            source: 'case_collaboration',
            details: {
              copied: !!copied,
            },
          })
        }

        if (typeof onShared === 'function') {
          onShared()
        }
      })
    })

    return card
  }

  function createSecurityComplianceCard(config, encounter, onAction) {
    var card = document.createElement('article')
    card.className = 'pc-tool-module pc-case-security'
    card.innerHTML = '<h3>Security & Compliance Controls</h3>'

    var intro = document.createElement('p')
    intro.className = 'pc-case-intel__summary'
    intro.textContent =
      'Runs runtime compliance checks and exports tamper-evident audit logs.'
    card.appendChild(intro)

    var details = document.createElement('div')
    details.className = 'pc-case-intel__summary'
    card.appendChild(details)

    var actions = document.createElement('div')
    actions.className = 'pc-panel-actions'

    var runCheckButton = document.createElement('button')
    runCheckButton.type = 'button'
    runCheckButton.className = 'pc-btn pc-btn--secondary'
    runCheckButton.textContent = 'Run Compliance Check'
    actions.appendChild(runCheckButton)

    var exportAuditCsvButton = document.createElement('button')
    exportAuditCsvButton.type = 'button'
    exportAuditCsvButton.className = 'pc-btn pc-btn--secondary'
    exportAuditCsvButton.textContent = 'Export Audit CSV'
    actions.appendChild(exportAuditCsvButton)

    var exportAuditJsonButton = document.createElement('button')
    exportAuditJsonButton.type = 'button'
    exportAuditJsonButton.className = 'pc-btn pc-btn--secondary'
    exportAuditJsonButton.textContent = 'Export Audit JSON'
    actions.appendChild(exportAuditJsonButton)

    card.appendChild(actions)

    var status = document.createElement('p')
    status.className = 'pc-case-outcome__status'
    status.textContent = 'Awaiting compliance check.'
    card.appendChild(status)

    function renderStatus() {
      if (
        !window.pcIntegration ||
        typeof window.pcIntegration.getSecurityStatus !== 'function'
      ) {
        details.textContent = 'Security status unavailable in this environment.'
        return null
      }

      var security = window.pcIntegration.getSecurityStatus()
      var auditText =
        security.audit && security.audit.ok
          ? 'OK (' + security.audit.total + ' records)'
          : 'Issue at index ' +
            (security.audit ? security.audit.brokenAt : 'unknown')

      details.textContent =
        'Transport HTTPS: ' +
        (security.httpsTransport ? 'yes' : 'no') +
        ' | Secure context: ' +
        (security.secureContext ? 'yes' : 'no') +
        ' | Background sync: ' +
        (security.backgroundSync ? 'enabled' : 'not available') +
        ' | Offline queue: ' +
        security.offlineQueueDepth +
        ' | Audit chain: ' +
        auditText +
        ' | Policy: ' +
        security.policyVersion
      return security
    }

    runCheckButton.addEventListener('click', function () {
      var security = renderStatus()
      if (!security) {
        status.textContent = 'Compliance check unavailable.'
        return
      }

      status.textContent =
        security.audit && security.audit.ok
          ? 'Compliance check complete: audit chain verified.'
          : 'Compliance check found an audit-chain integrity issue.'

      if (
        window.pcIntegration &&
        typeof window.pcIntegration.logCaseAction === 'function'
      ) {
        window.pcIntegration.logCaseAction({
          encounterId: encounter.id,
          caseId: config.caseId,
          caseTitle: config.title,
          action: 'compliance_check_run',
          source: 'security_compliance_card',
          details: {
            secureContext: security.secureContext,
            httpsTransport: security.httpsTransport,
            auditOk: !!(security.audit && security.audit.ok),
          },
        })
      }

      if (typeof onAction === 'function') {
        onAction()
      }
    })

    exportAuditCsvButton.addEventListener('click', function () {
      if (
        !window.pcIntegration ||
        typeof window.pcIntegration.exportAuditLog !== 'function'
      ) {
        status.textContent = 'Audit export is unavailable.'
        return
      }

      var result = window.pcIntegration.exportAuditLog('csv')
      status.textContent =
        result && result.ok
          ? 'Audit CSV exported (' + result.count + ' rows).'
          : 'Audit CSV export failed.'

      if (typeof onAction === 'function') {
        onAction()
      }
    })

    exportAuditJsonButton.addEventListener('click', function () {
      if (
        !window.pcIntegration ||
        typeof window.pcIntegration.exportAuditLog !== 'function'
      ) {
        status.textContent = 'Audit export is unavailable.'
        return
      }

      var result = window.pcIntegration.exportAuditLog('json')
      status.textContent =
        result && result.ok
          ? 'Audit JSON exported (' + result.count + ' rows).'
          : 'Audit JSON export failed.'

      if (typeof onAction === 'function') {
        onAction()
      }
    })

    renderStatus()
    return card
  }

  function createVeterinaryComplianceCard(config, encounter, onAction) {
    var passScore =
      config &&
      config.assessment &&
      Number.isFinite(Number(config.assessment.passScorePercent))
        ? Number(config.assessment.passScorePercent)
        : 80
    var latestScore = null

    var card = document.createElement('article')
    card.className = 'pc-tool-module pc-case-vet-compliance'
    card.innerHTML = '<h3>Veterinary Compliance Workflow</h3>'

    var intro = document.createElement('p')
    intro.className = 'pc-case-intel__summary'
    intro.textContent =
      'Log controlled-substance usage and issue CE credit after passing case skill checks.'
    card.appendChild(intro)

    var controlledTitle = document.createElement('p')
    controlledTitle.className = 'pc-case-step__title'
    controlledTitle.textContent = 'Controlled Substance Log'
    card.appendChild(controlledTitle)

    var controlledGrid = document.createElement('div')
    controlledGrid.className = 'pc-case-outcome__grid'

    var drugField = document.createElement('label')
    drugField.className = 'pc-case-outcome__field'
    drugField.innerHTML = '<span>Drug</span>'
    var drugInput = document.createElement('input')
    drugInput.className = 'pc-input'
    drugInput.type = 'text'
    drugInput.placeholder = 'e.g., fentanyl'
    drugField.appendChild(drugInput)
    controlledGrid.appendChild(drugField)

    var scheduleField = document.createElement('label')
    scheduleField.className = 'pc-case-outcome__field'
    scheduleField.innerHTML = '<span>DEA schedule</span>'
    var scheduleSelect = document.createElement('select')
    scheduleSelect.className = 'pc-input'
    scheduleSelect.innerHTML =
      '<option value="II">II</option>' +
      '<option value="III">III</option>' +
      '<option value="IV">IV</option>' +
      '<option value="V">V</option>'
    scheduleField.appendChild(scheduleSelect)
    controlledGrid.appendChild(scheduleField)

    var amountField = document.createElement('label')
    amountField.className = 'pc-case-outcome__field'
    amountField.innerHTML = '<span>Amount</span>'
    var amountInput = document.createElement('input')
    amountInput.className = 'pc-input'
    amountInput.type = 'number'
    amountInput.step = 'any'
    amountInput.min = '0'
    amountInput.placeholder = 'e.g., 0.6'
    amountField.appendChild(amountInput)
    controlledGrid.appendChild(amountField)

    var unitField = document.createElement('label')
    unitField.className = 'pc-case-outcome__field'
    unitField.innerHTML = '<span>Unit</span>'
    var unitInput = document.createElement('input')
    unitInput.className = 'pc-input'
    unitInput.type = 'text'
    unitInput.value = 'mg'
    unitField.appendChild(unitInput)
    controlledGrid.appendChild(unitField)

    var licenseField = document.createElement('label')
    licenseField.className = 'pc-case-outcome__field'
    licenseField.innerHTML = '<span>License # (optional)</span>'
    var licenseInput = document.createElement('input')
    licenseInput.className = 'pc-input'
    licenseInput.type = 'text'
    licenseField.appendChild(licenseInput)
    controlledGrid.appendChild(licenseField)

    var deaField = document.createElement('label')
    deaField.className = 'pc-case-outcome__field'
    deaField.innerHTML = '<span>DEA # (optional)</span>'
    var deaInput = document.createElement('input')
    deaInput.className = 'pc-input'
    deaInput.type = 'text'
    deaField.appendChild(deaInput)
    controlledGrid.appendChild(deaField)

    card.appendChild(controlledGrid)

    var controlledActions = document.createElement('div')
    controlledActions.className = 'pc-panel-actions'

    var logControlledButton = document.createElement('button')
    logControlledButton.type = 'button'
    logControlledButton.className = 'pc-btn pc-btn--secondary'
    logControlledButton.textContent = 'Log Controlled Entry'
    controlledActions.appendChild(logControlledButton)

    var exportControlledButton = document.createElement('button')
    exportControlledButton.type = 'button'
    exportControlledButton.className = 'pc-btn pc-btn--secondary'
    exportControlledButton.textContent = 'Export Controlled CSV'
    controlledActions.appendChild(exportControlledButton)

    card.appendChild(controlledActions)

    var controlledStatus = document.createElement('p')
    controlledStatus.className = 'pc-case-outcome__status'
    controlledStatus.textContent = 'No controlled-substance entry logged yet.'
    card.appendChild(controlledStatus)

    var ceTitle = document.createElement('p')
    ceTitle.className = 'pc-case-step__title'
    ceTitle.textContent = 'CE Credit Issuance'
    card.appendChild(ceTitle)

    var ceGrid = document.createElement('div')
    ceGrid.className = 'pc-case-outcome__grid'

    var learnerField = document.createElement('label')
    learnerField.className = 'pc-case-outcome__field'
    learnerField.innerHTML = '<span>Learner name</span>'
    var learnerInput = document.createElement('input')
    learnerInput.className = 'pc-input'
    learnerInput.type = 'text'
    learnerInput.placeholder = 'e.g., Dr A. Sharma'
    learnerField.appendChild(learnerInput)
    ceGrid.appendChild(learnerField)

    var stateField = document.createElement('label')
    stateField.className = 'pc-case-outcome__field'
    stateField.innerHTML = '<span>License state/province</span>'
    var stateInput = document.createElement('input')
    stateInput.className = 'pc-input'
    stateInput.type = 'text'
    stateInput.placeholder = 'e.g., ON'
    stateField.appendChild(stateInput)
    ceGrid.appendChild(stateField)

    var ceLicenseField = document.createElement('label')
    ceLicenseField.className = 'pc-case-outcome__field'
    ceLicenseField.innerHTML = '<span>License # (optional)</span>'
    var ceLicenseInput = document.createElement('input')
    ceLicenseInput.className = 'pc-input'
    ceLicenseInput.type = 'text'
    ceLicenseField.appendChild(ceLicenseInput)
    ceGrid.appendChild(ceLicenseField)

    card.appendChild(ceGrid)

    var ceActions = document.createElement('div')
    ceActions.className = 'pc-panel-actions'

    var issueCeButton = document.createElement('button')
    issueCeButton.type = 'button'
    issueCeButton.className = 'pc-btn pc-btn--secondary'
    issueCeButton.textContent = 'Issue CE Credit (0.5 hr)'
    issueCeButton.disabled = true
    ceActions.appendChild(issueCeButton)

    var exportCeButton = document.createElement('button')
    exportCeButton.type = 'button'
    exportCeButton.className = 'pc-btn pc-btn--secondary'
    exportCeButton.textContent = 'Export CE CSV'
    ceActions.appendChild(exportCeButton)

    card.appendChild(ceActions)

    var ceStatus = document.createElement('p')
    ceStatus.className = 'pc-case-outcome__status'
    ceStatus.textContent = 'Complete skill check to enable CE issuance.'
    card.appendChild(ceStatus)

    function updateAssessment(score) {
      latestScore = score && typeof score === 'object' ? score : null
      var eligible = !!(
        latestScore &&
        latestScore.stepCount > 0 &&
        latestScore.completed === latestScore.stepCount &&
        latestScore.percent >= passScore
      )
      issueCeButton.disabled = !eligible

      if (eligible) {
        ceStatus.textContent =
          'Eligible for CE credit issuance (' +
          latestScore.percent +
          '% score).'
      } else if (latestScore) {
        ceStatus.textContent =
          'CE locked. Need ' +
          passScore +
          '% with all steps attempted. Current: ' +
          latestScore.percent +
          '% (' +
          latestScore.completed +
          '/' +
          latestScore.stepCount +
          ').'
      } else {
        ceStatus.textContent = 'Complete skill check to enable CE issuance.'
      }
    }

    logControlledButton.addEventListener('click', function () {
      if (
        !window.pcIntegration ||
        typeof window.pcIntegration.logControlledSubstance !== 'function'
      ) {
        controlledStatus.textContent =
          'Controlled-substance logging unavailable.'
        return
      }

      var response = window.pcIntegration.logControlledSubstance({
        encounterId: encounter.id,
        caseId: config.caseId,
        caseTitle: config.title,
        drug: drugInput.value,
        schedule: scheduleSelect.value,
        amount: amountInput.value,
        unit: unitInput.value,
        licenseNumber: licenseInput.value,
        deaNumber: deaInput.value,
        notes: 'Logged via case workspace',
      })

      if (!response || !response.ok) {
        controlledStatus.textContent =
          'Failed to log controlled entry (' +
          (response && response.reason ? response.reason : 'unknown_error') +
          ').'
        return
      }

      controlledStatus.textContent =
        'Controlled entry logged: ' +
        response.record.drug +
        ' Schedule ' +
        response.record.schedule +
        ' (' +
        response.record.amount +
        ' ' +
        response.record.unit +
        ').'

      if (typeof onAction === 'function') {
        onAction()
      }
    })

    exportControlledButton.addEventListener('click', function () {
      if (
        !window.pcIntegration ||
        typeof window.pcIntegration.exportControlledSubstanceLog !== 'function'
      ) {
        controlledStatus.textContent =
          'Controlled-substance export unavailable.'
        return
      }

      var response = window.pcIntegration.exportControlledSubstanceLog('csv')
      controlledStatus.textContent =
        response && response.ok
          ? 'Controlled log exported (' + response.count + ' rows).'
          : 'Controlled log export failed.'

      if (typeof onAction === 'function') {
        onAction()
      }
    })

    issueCeButton.addEventListener('click', function () {
      if (
        !window.pcIntegration ||
        typeof window.pcIntegration.awardCeCredit !== 'function'
      ) {
        ceStatus.textContent = 'CE issuance unavailable.'
        return
      }

      if (!latestScore) {
        ceStatus.textContent =
          'CE issuance unavailable until score is calculated.'
        return
      }

      var response = window.pcIntegration.awardCeCredit({
        encounterId: encounter.id,
        caseId: config.caseId,
        caseTitle: config.title,
        learnerName: learnerInput.value,
        licenseState: stateInput.value,
        licenseNumber: ceLicenseInput.value,
        scorePercent: latestScore.percent,
        minimumScore: passScore,
        creditHours: 0.5,
        activityType: 'case_skill_check',
      })

      if (!response || !response.ok) {
        ceStatus.textContent =
          'CE issuance failed (' +
          (response && response.reason ? response.reason : 'unknown_error') +
          ').'
        return
      }

      ceStatus.textContent =
        'CE issued: ' +
        response.credit.certificateId +
        ' | ' +
        response.credit.creditHours +
        ' hr.'

      if (typeof onAction === 'function') {
        onAction()
      }
    })

    exportCeButton.addEventListener('click', function () {
      if (
        !window.pcIntegration ||
        typeof window.pcIntegration.exportCeCredits !== 'function'
      ) {
        ceStatus.textContent = 'CE export unavailable.'
        return
      }

      var response = window.pcIntegration.exportCeCredits('csv')
      ceStatus.textContent =
        response && response.ok
          ? 'CE export complete (' + response.count + ' records).'
          : 'CE export failed.'

      if (typeof onAction === 'function') {
        onAction()
      }
    })

    return {
      card: card,
      updateAssessment: updateAssessment,
    }
  }

  function createPanel(config, encounter) {
    var panel = document.createElement('section')
    panel.className = 'pc-case-section pc-card pc-case-intel'
    panel.setAttribute('aria-labelledby', 'pc-case-intel-title')

    var header = document.createElement('header')
    header.className = 'pc-case-intel__header'
    header.innerHTML =
      '<p class="pc-kicker">Phase 4 Live</p>' +
      '<h2 id="pc-case-intel-title">Case-Linked Calculator Workspace</h2>' +
      '<p class="pc-case-intel__meta">Encounter ID: <code>' +
      encounter.id +
      '</code></p>'

    var grid = document.createElement('div')
    grid.className = 'pc-case-intel__grid'

    var toolsCard = document.createElement('article')
    toolsCard.className = 'pc-tool-module'
    toolsCard.innerHTML = '<h3>Recommended Calculators</h3>'
    var toolsList = document.createElement('ul')
    toolsList.className = 'pc-case-intel__list'

    var decisionsCard = document.createElement('article')
    decisionsCard.className = 'pc-tool-module'
    decisionsCard.innerHTML = '<h3>Decision Checkpoints</h3>'
    var decisionsList = document.createElement('ol')
    decisionsList.className = 'pc-case-intel__list pc-case-intel__list--ordered'

    var i
    for (i = 0; i < config.tools.length; i += 1) {
      var tool = config.tools[i]
      var item = document.createElement('li')
      item.className = 'pc-case-intel__item'

      var link = document.createElement('a')
      link.className = 'pc-link-chip pc-link-chip--primary'
      link.textContent = tool.label

      if (
        window.pcIntegration &&
        typeof window.pcIntegration.buildPrefillUrl === 'function'
      ) {
        link.href = window.pcIntegration.buildPrefillUrl(
          tool.href,
          tool.params || {},
          {
            caseId: config.caseId,
            encounterId: encounter.id,
          }
        )
      } else {
        link.href = tool.href
      }

      ;(function (selectedTool, targetHref) {
        link.addEventListener('click', function () {
          if (
            window.pcIntegration &&
            typeof window.pcIntegration.logCaseAction === 'function'
          ) {
            window.pcIntegration.logCaseAction({
              encounterId: encounter.id,
              caseId: config.caseId,
              caseTitle: config.title,
              action: 'calculator_launch',
              source: 'case_workspace',
              details: {
                calculatorId: selectedTool.id,
                calculatorLabel: selectedTool.label,
                href: targetHref,
              },
            })
          }
        })
      })(tool, link.href)

      var detail = document.createElement('p')
      detail.className = 'pc-case-intel__summary'
      detail.textContent = tool.summary

      item.appendChild(link)
      item.appendChild(detail)
      toolsList.appendChild(item)
    }

    for (i = 0; i < config.decisionPoints.length; i += 1) {
      var decision = document.createElement('li')
      decision.className = 'pc-case-intel__item'
      decision.textContent = config.decisionPoints[i]
      decisionsList.appendChild(decision)
    }

    toolsCard.appendChild(toolsList)
    decisionsCard.appendChild(decisionsList)
    grid.appendChild(toolsCard)
    grid.appendChild(decisionsCard)

    var stats = document.createElement('p')
    stats.className = 'pc-calculator-note'
    stats.setAttribute('data-pc-encounter-stats', '')
    var latestAssessmentScore = null
    var applyAssessmentToCompliance = null

    var assessmentCard = createAssessmentCard(
      config,
      encounter,
      function (score) {
        latestAssessmentScore = score
        if (typeof applyAssessmentToCompliance === 'function') {
          applyAssessmentToCompliance(score)
        }
        renderStats(encounter.id, stats)
      }
    )
    if (assessmentCard) {
      grid.appendChild(assessmentCard)
    }

    var outcomeCard = createOutcomeCard(config, encounter, function () {
      renderStats(encounter.id, stats)
    })
    if (outcomeCard) {
      grid.appendChild(outcomeCard)
    }

    var collabCard = createCollaborationCard(config, encounter, function () {
      renderStats(encounter.id, stats)
    })
    if (collabCard) {
      grid.appendChild(collabCard)
    }

    var securityCard = createSecurityComplianceCard(
      config,
      encounter,
      function () {
        renderStats(encounter.id, stats)
      }
    )
    if (securityCard) {
      grid.appendChild(securityCard)
    }

    var vetCompliance = createVeterinaryComplianceCard(
      config,
      encounter,
      function () {
        renderStats(encounter.id, stats)
      }
    )
    if (vetCompliance && vetCompliance.card) {
      applyAssessmentToCompliance =
        typeof vetCompliance.updateAssessment === 'function'
          ? vetCompliance.updateAssessment
          : null
      if (applyAssessmentToCompliance && latestAssessmentScore) {
        applyAssessmentToCompliance(latestAssessmentScore)
      }
      grid.appendChild(vetCompliance.card)
    }

    var actions = document.createElement('div')
    actions.className = 'pc-panel-actions'
    actions.innerHTML =
      '<button type="button" class="pc-btn pc-btn--secondary" data-pc-export-json>Export Encounter JSON</button>' +
      '<button type="button" class="pc-btn pc-btn--secondary" data-pc-export-csv>Export Encounter CSV</button>' +
      '<button type="button" class="pc-btn pc-btn--secondary" data-pc-export-fhir>Export Encounter FHIR</button>' +
      '<button type="button" class="pc-btn pc-btn--secondary" data-pc-export-pdf>Export Encounter PDF</button>'

    panel.appendChild(header)
    panel.appendChild(grid)
    panel.appendChild(actions)
    panel.appendChild(stats)

    renderStats(encounter.id, stats)

    actions
      .querySelector('[data-pc-export-json]')
      .addEventListener('click', function () {
        if (
          window.pcIntegration &&
          typeof window.pcIntegration.exportEncounter === 'function'
        ) {
          window.pcIntegration.exportEncounter(encounter.id, 'json')
          renderStats(encounter.id, stats)
        }
      })

    actions
      .querySelector('[data-pc-export-csv]')
      .addEventListener('click', function () {
        if (
          window.pcIntegration &&
          typeof window.pcIntegration.exportEncounter === 'function'
        ) {
          window.pcIntegration.exportEncounter(encounter.id, 'csv')
          renderStats(encounter.id, stats)
        }
      })

    actions
      .querySelector('[data-pc-export-fhir]')
      .addEventListener('click', function () {
        if (
          window.pcIntegration &&
          typeof window.pcIntegration.exportEncounter === 'function'
        ) {
          window.pcIntegration.exportEncounter(encounter.id, 'fhir')
          renderStats(encounter.id, stats)
        }
      })

    actions
      .querySelector('[data-pc-export-pdf]')
      .addEventListener('click', function () {
        if (
          window.pcIntegration &&
          typeof window.pcIntegration.exportEncounter === 'function'
        ) {
          window.pcIntegration.exportEncounter(encounter.id, 'pdf')
          renderStats(encounter.id, stats)
        }
      })

    window.addEventListener('focus', function () {
      renderStats(encounter.id, stats)
    })

    return panel
  }

  function insertPanel(panel) {
    var article = document.querySelector('.pc-case-article')
    if (!article) {
      return
    }

    var diagnoseBox = article.querySelector('.pc-diagnose-box')
    if (diagnoseBox && diagnoseBox.parentNode) {
      if (diagnoseBox.nextSibling) {
        diagnoseBox.parentNode.insertBefore(panel, diagnoseBox.nextSibling)
      } else {
        diagnoseBox.parentNode.appendChild(panel)
      }
      return
    }

    var disclaimer = article.querySelector('.pc-disclaimer')
    if (disclaimer && disclaimer.parentNode) {
      disclaimer.parentNode.insertBefore(panel, disclaimer)
      return
    }

    article.appendChild(panel)
  }

  function bindDiagnoseTracking(config, encounter) {
    var buttons = document.querySelectorAll('[id$="-check-btn"]')
    var i

    for (i = 0; i < buttons.length; i += 1) {
      buttons[i].addEventListener('click', function () {
        var button = this

        window.setTimeout(function () {
          var container = button.closest('.pc-diagnose-container')
          if (
            !container ||
            !window.pcIntegration ||
            typeof window.pcIntegration.logCaseAction !== 'function'
          ) {
            return
          }

          var selected = container.querySelector('input[type="radio"]:checked')
          var questionNode = container.querySelector('.pc-diagnose-question')
          var feedbackTitle = container.querySelector(
            '.pc-diagnose-feedback h4'
          )
          var feedbackText = feedbackTitle
            ? String(feedbackTitle.textContent || '').toLowerCase()
            : ''
          var outcome = 'unknown'

          if (feedbackText.indexOf('correct') !== -1) {
            outcome = 'correct'
          } else if (
            feedbackText.indexOf('not the best') !== -1 ||
            feedbackText.indexOf('not') !== -1
          ) {
            outcome = 'incorrect'
          }

          window.pcIntegration.logCaseAction({
            encounterId: encounter.id,
            caseId: config.caseId,
            caseTitle: config.title,
            action: 'diagnose_submit',
            source: 'diagnose_block',
            details: {
              selectedOption: selected ? selected.value : '',
              outcome: outcome,
              question: questionNode ? questionNode.textContent.trim() : '',
            },
          })
        }, 80)
      })
    }
  }

  function createOfflinePhaseCard(config, activate) {
    var panel = document.createElement('section')
    panel.className = 'pc-case-section pc-card pc-case-intel'
    panel.setAttribute('aria-labelledby', 'pc-case-phase4-offline-title')

    var header = document.createElement('header')
    header.className = 'pc-case-intel__header'
    header.innerHTML =
      '<p class="pc-kicker">Phase 4 Offline</p>' +
      '<h2 id="pc-case-phase4-offline-title">Case-Linked Calculator Workspace</h2>' +
      '<p class="pc-case-intel__summary">For practice questions, Phase 4 stays offline until the client clicks More.</p>'

    var body = document.createElement('article')
    body.className = 'pc-tool-module'
    body.innerHTML =
      '<h3>' +
      config.title +
      '</h3>' +
      '<p>Click <strong>More</strong> to load Phase 4 workspace tools, encounter logging, and exports for this case.</p>'

    var actions = document.createElement('div')
    actions.className = 'pc-panel-actions'

    var moreButton = document.createElement('button')
    moreButton.type = 'button'
    moreButton.className = 'pc-btn'
    moreButton.textContent = 'More'

    var status = document.createElement('p')
    status.className = 'pc-calculator-note pc-is-warning'
    status.textContent = 'Status: offline'

    moreButton.addEventListener('click', function () {
      moreButton.disabled = true
      status.textContent = 'Loading Phase 4 workspace...'

      var activated = false
      if (typeof activate === 'function') {
        activated = !!activate()
      }

      if (!activated) {
        moreButton.disabled = false
        status.textContent = 'Phase 4 unavailable right now. Please try again.'
      }
    })

    actions.appendChild(moreButton)
    panel.appendChild(header)
    panel.appendChild(body)
    panel.appendChild(actions)
    panel.appendChild(status)

    return panel
  }

  function activatePhase4(config, offlinePanel) {
    if (
      !window.pcIntegration ||
      typeof window.pcIntegration.ensureEncounter !== 'function'
    ) {
      return false
    }

    var encounter = window.pcIntegration.ensureEncounter({
      caseId: config.caseId,
      caseTitle: config.title,
      patient: config.patient,
      source: 'case_page',
    })

    if (!encounter) {
      return false
    }

    window.pcIntegration.logCaseOpen({
      caseId: config.caseId,
      caseTitle: config.title,
      encounterId: encounter.id,
      patient: config.patient,
    })

    var panel = createPanel(config, encounter)
    if (offlinePanel && offlinePanel.parentNode) {
      offlinePanel.parentNode.replaceChild(panel, offlinePanel)
    } else {
      insertPanel(panel)
    }

    bindDiagnoseTracking(config, encounter)
    return true
  }

  function init() {
    var config = getConfig()
    if (!config) {
      return
    }

    var offlinePanel = createOfflinePhaseCard(config, function () {
      return activatePhase4(config, offlinePanel)
    })
    insertPanel(offlinePanel)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
