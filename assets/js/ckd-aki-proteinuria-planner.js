;(function () {
  'use strict'

  function byId(id) {
    return document.getElementById(id)
  }

  function toNumber(value) {
    var parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : NaN
  }

  function setText(id, text) {
    var node = byId(id)
    if (node) {
      node.textContent = text
    }
  }

  function setList(id, items) {
    var node = byId(id)
    if (!node) {
      return
    }

    node.innerHTML = ''

    for (var i = 0; i < items.length; i += 1) {
      var item = document.createElement('li')
      item.textContent = items[i]
      node.appendChild(item)
    }
  }

  function getCreatinineStage(species, creatinine) {
    if (!Number.isFinite(creatinine) || creatinine <= 0) {
      return {
        stage: 0,
        label: 'Enter creatinine',
        shortLabel: 'Unknown',
      }
    }

    var isCat = species === 'cat'
    var stage

    if (isCat) {
      if (creatinine < 1.6) {
        stage = 1
      } else if (creatinine <= 2.8) {
        stage = 2
      } else if (creatinine <= 5.0) {
        stage = 3
      } else {
        stage = 4
      }
    } else {
      if (creatinine < 1.4) {
        stage = 1
      } else if (creatinine <= 2.0) {
        stage = 2
      } else if (creatinine <= 5.0) {
        stage = 3
      } else {
        stage = 4
      }
    }

    return {
      stage: stage,
      label: 'IRIS CKD Stage ' + stage + ' (creatinine-based estimate)',
      shortLabel: 'Stage ' + stage,
    }
  }

  function getProteinuriaSubstage(species, upc) {
    if (!Number.isFinite(upc) || upc < 0) {
      return {
        status: 'unknown',
        label: 'UPC not entered',
        action: 'Add UPC trend to complete renal substaging.',
      }
    }

    if (upc < 0.2) {
      return {
        status: 'non_proteinuric',
        label: 'Non-proteinuric (UPC < 0.2)',
        action: 'Continue routine UPC surveillance with renal trend checks.',
      }
    }

    if (species === 'cat') {
      if (upc < 0.4) {
        return {
          status: 'borderline',
          label: 'Borderline proteinuric (cat UPC 0.2-0.4)',
          action:
            'Repeat UPC and blood pressure to verify persistence before major plan changes.',
        }
      }

      return {
        status: 'proteinuric',
        label: 'Proteinuric (cat UPC > 0.4)',
        action:
          'Confirm persistence and discuss proteinuria-targeted renal management with clinician protocol.',
      }
    }

    if (upc < 0.5) {
      return {
        status: 'borderline',
        label: 'Borderline proteinuric (dog UPC 0.2-0.5)',
        action:
          'Repeat UPC and blood pressure to verify persistence before major plan changes.',
      }
    }

    return {
      status: 'proteinuric',
      label: 'Proteinuric (dog UPC > 0.5)',
      action:
        'Confirm persistence and discuss proteinuria-targeted renal management with clinician protocol.',
    }
  }

  function getBpCategory(sbp, repeats, hasTodConcern) {
    if (!Number.isFinite(sbp) || sbp <= 0) {
      return {
        level: 'unknown',
        label: 'BP not entered',
        risk: 'BP risk not classed',
        recheck:
          'Collect calm serial blood pressure readings before classing risk.',
      }
    }

    var level
    var risk
    var recheck

    if (sbp < 140) {
      level = 'normotensive'
      risk = 'Minimal target-organ-damage risk'
      recheck = 'Recheck within 2-3 months (earlier if renal values worsen).'
    } else if (sbp < 160) {
      level = 'prehypertensive'
      risk = 'Low target-organ-damage risk'
      recheck = 'Repeat within 2-4 weeks to confirm sustained trend.'
    } else if (sbp < 180) {
      level = 'hypertensive'
      risk = 'Moderate target-organ-damage risk'
      recheck = 'Confirm and act within 3-7 days with retinal/CNS assessment.'
    } else {
      level = 'severely_hypertensive'
      risk = 'High target-organ-damage risk'
      recheck = 'Urgent same-day reassessment and pressure control planning.'
    }

    if (hasTodConcern) {
      risk = 'High target-organ-damage concern'
      recheck =
        'Urgent same-day workup for ocular, neurologic, and renal injury patterns.'
    } else if (repeats < 3 && sbp < 180) {
      recheck +=
        ' Obtain at least 3 readings in a calm setting before final class assignment.'
    }

    var labelMap = {
      normotensive: 'Normotensive (<140 mmHg)',
      prehypertensive: 'Prehypertensive (140-159 mmHg)',
      hypertensive: 'Hypertensive (160-179 mmHg)',
      severely_hypertensive: 'Severely hypertensive (>=180 mmHg)',
    }

    return {
      level: level,
      label: labelMap[level] || 'BP classed',
      risk: risk,
      recheck: recheck,
    }
  }

  function getRenalPattern(flags, stage) {
    var ckdScore = 0
    var akiScore = 0

    if (flags.chronic) {
      ckdScore += 2
    }
    if (stage >= 2) {
      ckdScore += 1
    }

    if (flags.acuteTrigger) {
      akiScore += 1
    }
    if (flags.oliguria) {
      akiScore += 1
    }
    if (flags.rapidRise) {
      akiScore += 1
    }

    if (ckdScore >= 2 && akiScore >= 1) {
      return {
        type: 'acute_on_chronic',
        label: 'Possible acute-on-chronic pattern',
        action:
          'Treat as unstable renal course and reassess values, urine output, and perfusion frequently.',
      }
    }

    if (akiScore >= 2 && ckdScore <= 1) {
      return {
        type: 'aki_likely',
        label: 'Likely AKI pattern',
        action:
          'Escalate AKI workup and perfusion-directed stabilization without delay.',
      }
    }

    if (ckdScore >= 2 && akiScore === 0) {
      return {
        type: 'ckd_likely',
        label: 'Likely CKD pattern',
        action:
          'Use CKD staging/substaging trends to drive interval monitoring and long-term plan adjustments.',
      }
    }

    if (akiScore === 1 && ckdScore <= 1) {
      return {
        type: 'early_aki_flag',
        label: 'Early AKI concern / indeterminate',
        action:
          'Repeat chemistry and urine output checks soon to separate transient change from evolving injury.',
      }
    }

    return {
      type: 'indeterminate',
      label: 'Indeterminate CKD-vs-AKI pattern',
      action:
        'Integrate trend data, urinalysis, imaging, and hemodynamic context before final pattern labeling.',
    }
  }

  function getSdmaNote(sdma, stage) {
    if (!Number.isFinite(sdma) || sdma <= 0) {
      return 'SDMA not entered. Add SDMA trend when available for earlier renal context refinement.'
    }

    if (sdma >= 36 && stage <= 2) {
      return 'SDMA is markedly elevated relative to early creatinine stage; review for earlier or progressing renal compromise.'
    }

    if (sdma >= 18 && stage === 1) {
      return 'SDMA elevation may indicate renal dysfunction ahead of creatinine stage shift.'
    }

    if (sdma <= 14 && stage >= 3) {
      return 'Creatinine and SDMA are discordant. Recheck hydration and muscle-mass context with repeat sampling.'
    }

    return 'SDMA trend is directionally compatible with current creatinine stage context.'
  }

  function render(event) {
    if (event) {
      event.preventDefault()
    }

    var species = String(byId('kap-species').value || 'dog').toLowerCase()
    var creatinine = toNumber(byId('kap-creatinine').value)
    var sdma = toNumber(byId('kap-sdma').value)
    var upc = toNumber(byId('kap-upc').value)
    var sbp = toNumber(byId('kap-sbp').value)
    var repeats = parseInt(byId('kap-bp-repeats').value || '3', 10)

    if (!Number.isFinite(creatinine) || creatinine <= 0) {
      setText(
        'kap-note',
        'Enter a valid creatinine value to generate renal stage output.'
      )
      setText('kap-stage', 'Enter creatinine')
      setText('kap-proteinuria', '-')
      setText('kap-bp-class', '-')
      setText('kap-pattern', '-')
      setText('kap-recheck', '-')
      setList('kap-actions', ['Creatinine is required for stage estimation.'])
      return
    }

    var flags = {
      chronic: !!(byId('kap-chronic') && byId('kap-chronic').checked),
      acuteTrigger: !!(
        byId('kap-acute-trigger') && byId('kap-acute-trigger').checked
      ),
      oliguria: !!(byId('kap-oliguria') && byId('kap-oliguria').checked),
      rapidRise: !!(byId('kap-rapid-rise') && byId('kap-rapid-rise').checked),
      tod: !!(byId('kap-tod') && byId('kap-tod').checked),
    }

    var stage = getCreatinineStage(species, creatinine)
    var proteinuria = getProteinuriaSubstage(species, upc)
    var bp = getBpCategory(sbp, repeats, flags.tod)
    var pattern = getRenalPattern(flags, stage.stage)
    var sdmaNote = getSdmaNote(sdma, stage.stage)

    setText('kap-stage', stage.label)
    setText('kap-proteinuria', proteinuria.label)
    setText('kap-bp-class', bp.label)
    setText('kap-pattern', pattern.label)

    var actions = []
    actions.push(pattern.action)
    actions.push(proteinuria.action)

    if (stage.stage >= 3) {
      actions.push(
        'Stage 3-4 range detected: prioritize close electrolyte, acid-base, hydration, and anemia trend surveillance.'
      )
    } else {
      actions.push(
        'Track serial renal trends (creatinine/SDMA/UPC/BP) to detect progression before overt decompensation.'
      )
    }

    if (
      bp.level === 'hypertensive' ||
      bp.level === 'severely_hypertensive' ||
      flags.tod
    ) {
      actions.push(
        'Blood pressure concern present: include retinal and neurologic checks in immediate reassessment workflow.'
      )
    }

    setList('kap-actions', actions)
    setText('kap-recheck', bp.recheck)
    setText('kap-note', bp.risk + ' ' + sdmaNote)
  }

  function init() {
    var form = byId('kap-form')
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
