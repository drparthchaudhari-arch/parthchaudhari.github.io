;(function () {
  'use strict'

  var REFERENCE_BASELINE = [
    'ACVIM cardiology consensus guideline references',
    'Normal lab values',
    'RECOVER CPR guidelines',
  ]

  var integrationContext = {
    caseId: '',
    encounterId: '',
    autoRun: false,
  }

  function setText(id, text) {
    var node = document.getElementById(id)
    if (node) {
      node.textContent = text
    }
  }

  function setOverrideNote(message, isWarning) {
    var note = document.getElementById('chf-override-note')
    if (!note) {
      return
    }

    if (!message) {
      note.hidden = true
      note.textContent = ''
      note.classList.remove('pc-is-warning')
      return
    }

    note.hidden = false
    note.textContent = message
    note.classList.toggle('pc-is-warning', !!isWarning)
  }

  function parseQuery() {
    try {
      return new URLSearchParams(window.location.search || '')
    } catch (error) {
      return new URLSearchParams('')
    }
  }

  function isTruthyParam(value) {
    var normalized = String(value || '')
      .trim()
      .toLowerCase()
    return (
      normalized === '1' ||
      normalized === 'true' ||
      normalized === 'yes' ||
      normalized === 'on'
    )
  }

  function setCheckboxFromParam(id, value) {
    var node = document.getElementById(id)
    if (!node) {
      return false
    }

    if (!value) {
      return false
    }

    node.checked = isTruthyParam(value)
    return true
  }

  function applyPrefillFromQuery() {
    var params = parseQuery()
    var prefilled = false

    prefilled =
      setCheckboxFromParam(
        'chf-signs',
        params.get('signs') || params.get('clinicalSigns')
      ) || prefilled
    prefilled =
      setCheckboxFromParam('chf-edema', params.get('edema')) || prefilled
    prefilled =
      setCheckboxFromParam('chf-remodeling', params.get('remodeling')) ||
      prefilled

    integrationContext.caseId = String(
      params.get('case') || params.get('caseId') || ''
    )
      .trim()
      .toLowerCase()
    integrationContext.encounterId = String(params.get('encounter') || '')
      .trim()
      .toLowerCase()
    integrationContext.autoRun = String(params.get('auto') || '').trim() === '1'

    var note = document.getElementById('chf-context-note')
    if (note) {
      if (
        integrationContext.caseId ||
        integrationContext.encounterId ||
        prefilled
      ) {
        note.hidden = false
        note.textContent =
          'Case-linked prefill active' +
          (integrationContext.caseId
            ? ' for ' + integrationContext.caseId
            : '') +
          (integrationContext.encounterId
            ? ' | encounter: ' + integrationContext.encounterId
            : '') +
          '.'
      } else {
        note.hidden = true
      }
    }
  }

  function logCalculation(inputs, outputs, overrideMeta) {
    if (
      !window.pcIntegration ||
      typeof window.pcIntegration.logCalculation !== 'function'
    ) {
      return
    }

    var meta =
      overrideMeta && typeof overrideMeta === 'object' ? overrideMeta : {}

    window.pcIntegration.logCalculation({
      caseId: integrationContext.caseId,
      encounterId: integrationContext.encounterId,
      caseTitle: document.title,
      calculatorId: 'chf_staging_planner',
      calculatorLabel: 'CHF Staging Planner',
      source: 'tool_chf_staging',
      inputs: inputs,
      outputs: outputs,
      references: REFERENCE_BASELINE,
      userOverride: !!meta.userOverride,
      overrideReason: String(meta.overrideReason || '').trim(),
    })
  }

  function render(event, options) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault()
    }
    var opts = options && typeof options === 'object' ? options : {}

    var clinicalSigns = document.getElementById('chf-signs').checked
    var edema = document.getElementById('chf-edema').checked
    var remodeling = document.getElementById('chf-remodeling').checked
    var userOverride = !!(
      document.getElementById('chf-override') &&
      document.getElementById('chf-override').checked
    )
    var overrideReasonNode = document.getElementById('chf-override-reason')
    var overrideReason = overrideReasonNode
      ? String(overrideReasonNode.value || '').trim()
      : ''

    var stage
    var next
    var recheck

    if (clinicalSigns && edema) {
      stage = 'Likely CHF stage C pattern'
      next =
        'Begin decongestive treatment pathway and monitor perfusion/renal trends closely.'
      recheck =
        'Recheck in 3-7 days after stabilization, then stage-based follow-up.'
    } else if (remodeling && !clinicalSigns) {
      stage = 'Likely preclinical stage B2 pattern'
      next =
        'Confirm imaging and risk profile; begin stage-appropriate medical management plan.'
      recheck = 'Recheck in 1-3 months with home respiratory trend tracking.'
    } else {
      stage = 'Likely early or indeterminate stage pattern'
      next =
        'Correlate exam findings with imaging and blood pressure before changing chronic regimen.'
      recheck = 'Set follow-up based on symptom burden and progression risk.'
    }

    setText('chf-stage', stage)
    setText('chf-next', next)
    setText('chf-recheck', recheck)
    setText(
      'chf-note',
      'Educational staging support only. Final stage assignment requires full cardiology workup and clinician judgment.'
    )

    if (opts.skipLog && !userOverride) {
      setOverrideNote('', false)
    }

    if (!opts.skipLog) {
      if (userOverride && !overrideReason) {
        setOverrideNote(
          'Override is selected. Enter an override reason to save this run in encounter logs.',
          true
        )
        return
      }

      if (userOverride) {
        setOverrideNote(
          'Override reason captured and saved with this calculation.',
          false
        )
      } else {
        setOverrideNote('', false)
      }

      logCalculation(
        {
          clinicalSigns: clinicalSigns,
          edema: edema,
          remodeling: remodeling,
        },
        {
          stage: stage,
          nextStep: next,
          recheckTiming: recheck,
        },
        {
          userOverride: userOverride,
          overrideReason: overrideReason,
        }
      )
    }
  }

  function init() {
    var form = document.getElementById('chf-form')
    if (!form) {
      return
    }

    applyPrefillFromQuery()
    form.addEventListener('submit', function (event) {
      render(event, { skipLog: false })
    })
    form.addEventListener('change', function () {
      render(null, { skipLog: true })
    })
    render(null, { skipLog: !integrationContext.autoRun })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
