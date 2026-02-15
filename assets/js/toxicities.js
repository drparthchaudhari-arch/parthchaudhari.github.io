;(function () {
  'use strict'

  var TREE = {
    start: {
      type: 'question',
      text: 'Known or suspected toxin exposure within the last 6 hours?',
      yes: 'highRisk',
      no: 'symptoms',
    },
    highRisk: {
      type: 'question',
      text: 'Is the toxin high-risk (xylitol, lilies, grapes/raisins, NSAID, dark chocolate)?',
      yes: 'emergency',
      no: 'unknownDose',
    },
    symptoms: {
      type: 'question',
      text: 'Are there current signs (vomiting, tremors, collapse, seizures, severe lethargy)?',
      yes: 'emergency',
      no: 'monitor',
    },
    unknownDose: {
      type: 'question',
      text: 'Is the ingested amount unknown or potentially moderate/high?',
      yes: 'emergency',
      no: 'observe',
    },
    emergency: {
      type: 'result',
      urgency: 'yes',
      text: 'YES: Treat as an emergency. Stabilize, consider decontamination window, and initiate toxin-specific monitoring now.',
    },
    monitor: {
      type: 'result',
      urgency: 'no',
      text: 'NO immediate red flag from this quick screen, but continue close observation and re-triage if any new signs appear.',
    },
    observe: {
      type: 'result',
      urgency: 'no',
      text: 'NO for immediate emergency threshold in this branch. Provide owner instructions and recheck plan.',
    },
  }

  var state = {
    node: 'start',
  }

  function getNode(id) {
    return TREE[id] || TREE.start
  }

  function setResultStyle(resultNode, urgency) {
    if (!resultNode) {
      return
    }

    resultNode.classList.remove('pc-triage-result--yes')
    resultNode.classList.remove('pc-triage-result--no')

    if (urgency === 'yes') {
      resultNode.classList.add('pc-triage-result--yes')
    } else {
      resultNode.classList.add('pc-triage-result--no')
    }
  }

  function render() {
    var questionNode = document.getElementById('tox-question')
    var optionsNode = document.getElementById('tox-options')
    var resultNode = document.getElementById('tox-result')
    var resetNode = document.getElementById('tox-reset')
    var current = getNode(state.node)

    if (!questionNode || !optionsNode || !resultNode || !resetNode) {
      return
    }

    if (current.type === 'question') {
      questionNode.textContent = current.text
      optionsNode.hidden = false
      resultNode.hidden = true
      resetNode.hidden = true
      return
    }

    questionNode.textContent = 'Decision'
    optionsNode.hidden = true
    resultNode.hidden = false
    resultNode.textContent = current.text
    setResultStyle(resultNode, current.urgency)
    resetNode.hidden = false
  }

  function choose(direction) {
    var current = getNode(state.node)
    if (current.type !== 'question') {
      return
    }

    state.node = direction === 'yes' ? current.yes : current.no
    render()
  }

  function resetTree() {
    state.node = 'start'
    render()
  }

  function init() {
    var yesButton = document.querySelector('[data-tox-choice="yes"]')
    var noButton = document.querySelector('[data-tox-choice="no"]')
    var resetButton = document.getElementById('tox-reset')

    if (!yesButton || !noButton || !resetButton) {
      return
    }

    yesButton.addEventListener('click', function () {
      choose('yes')
    })

    noButton.addEventListener('click', function () {
      choose('no')
    })

    resetButton.addEventListener('click', resetTree)
    render()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
