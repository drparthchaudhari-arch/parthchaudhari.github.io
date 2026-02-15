;(function () {
  'use strict'

  var QUESTION_BANK_URL = '/content/navle/questions.json'
  var SIMULATOR_QUESTION_COUNT = 24
  var EXAM_DURATION_SECONDS = 36 * 60
  var STORAGE_KEY = 'pc_navle_exam_simulator_session_v1'

  var state = {
    allQuestions: [],
    questions: [],
    answers: [],
    marked: {},
    currentIndex: 0,
    remainingSeconds: EXAM_DURATION_SECONDS,
    timerId: null,
    examActive: false,
    submitted: false,
    startedAtIso: null,
  }

  function byId(id) {
    return document.getElementById(id)
  }

  function safeParse(value, fallback) {
    try {
      var parsed = JSON.parse(value)
      return parsed !== null ? parsed : fallback
    } catch (error) {
      return fallback
    }
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      return null
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      return false
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      return false
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function normalizeTopic(topic) {
    var value = String(topic || 'general')
      .trim()
      .toLowerCase()
    if (!value) {
      return 'general'
    }
    return value
  }

  function topicLabel(topic) {
    var value = normalizeTopic(topic).replace(/[-_]+/g, ' ')
    return value.replace(/\b\w/g, function (char) {
      return char.toUpperCase()
    })
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  function formatClock(totalSeconds) {
    var safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
    var minutes = Math.floor(safeSeconds / 60)
    var seconds = safeSeconds % 60
    return (
      String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
    )
  }

  function parseQuestions(payload) {
    if (!Array.isArray(payload)) {
      return []
    }

    return payload
      .filter(function (question) {
        if (!question || typeof question !== 'object') {
          return false
        }

        if (
          !question.id ||
          !question.stem ||
          !question.options ||
          !question.correct
        ) {
          return false
        }

        var optionKeys = Object.keys(question.options)
        if (optionKeys.length < 2) {
          return false
        }

        return optionKeys.indexOf(String(question.correct).toUpperCase()) !== -1
      })
      .map(function (question) {
        return {
          id: String(question.id),
          topic: normalizeTopic(question.topic),
          stem: String(question.stem),
          options: question.options,
          correct: String(question.correct).toUpperCase(),
          explanation: question.explanation ? String(question.explanation) : '',
        }
      })
  }

  function sortedOptionEntries(question) {
    return Object.keys(question.options || {})
      .sort()
      .map(function (key) {
        return [key, question.options[key]]
      })
  }

  function rememberLearningLocation() {
    safeSet(
      'pc_last_learning_url_v1',
      window.location.pathname + window.location.search
    )
    safeSet('pc_last_learning_seen_at_v1', new Date().toISOString())
  }

  function getAnsweredCount() {
    return state.answers.reduce(function (count, answer) {
      return count + (answer ? 1 : 0)
    }, 0)
  }

  function getMarkedCount() {
    var total = 0
    var length = state.questions.length
    var index

    for (index = 0; index < length; index += 1) {
      if (isMarked(index)) {
        total += 1
      }
    }

    return total
  }

  function getNotDoneCount() {
    return Math.max(0, state.questions.length - getAnsweredCount())
  }

  function isMarked(index) {
    return !!state.marked[String(index)]
  }

  function setMarked(index, value) {
    var key = String(index)
    if (value) {
      state.marked[key] = true
    } else {
      delete state.marked[key]
    }
  }

  function getQuestionStatus(index) {
    var answered = !!state.answers[index]
    var marked = isMarked(index)

    if (marked && answered) {
      return 'marked-answered'
    }

    if (marked) {
      return 'marked'
    }

    if (answered) {
      return 'answered'
    }

    return 'not-done'
  }

  function getQuestionStatusText(status) {
    if (status === 'marked-answered') {
      return 'marked and answered'
    }
    if (status === 'marked') {
      return 'marked'
    }
    if (status === 'answered') {
      return 'answered'
    }
    return 'not done'
  }

  function persistSession() {
    if (!state.examActive || state.submitted || !state.questions.length) {
      return
    }

    safeSet(
      STORAGE_KEY,
      JSON.stringify({
        questionIds: state.questions.map(function (question) {
          return question.id
        }),
        currentIndex: state.currentIndex,
        answers: state.answers,
        marked: state.marked,
        remainingSeconds: state.remainingSeconds,
        startedAtIso: state.startedAtIso,
        updatedAt: Date.now(),
      })
    )
  }

  function clearSession() {
    safeRemove(STORAGE_KEY)
  }

  function questionsFromIds(ids) {
    var map = {}
    var hydrated = []
    var index

    state.allQuestions.forEach(function (question) {
      map[question.id] = question
    })

    for (index = 0; index < ids.length; index += 1) {
      var question = map[ids[index]]
      if (question) {
        hydrated.push(question)
      }
    }

    return hydrated
  }

  function hydrateSavedSession() {
    var payload = safeParse(safeGet(STORAGE_KEY) || '{}', null)
    if (!payload || !Array.isArray(payload.questionIds)) {
      return false
    }

    var hydratedQuestions = questionsFromIds(payload.questionIds)
    if (hydratedQuestions.length !== SIMULATOR_QUESTION_COUNT) {
      return false
    }

    state.questions = hydratedQuestions
    state.answers = Array.isArray(payload.answers)
      ? payload.answers.slice(0, hydratedQuestions.length)
      : []
    while (state.answers.length < hydratedQuestions.length) {
      state.answers.push('')
    }

    state.answers = state.answers.map(function (answer) {
      return typeof answer === 'string' ? answer.toUpperCase() : ''
    })

    state.marked =
      payload.marked && typeof payload.marked === 'object' ? payload.marked : {}
    state.currentIndex = clamp(
      Number(payload.currentIndex) || 0,
      0,
      hydratedQuestions.length - 1
    )
    state.remainingSeconds = clamp(
      Number(payload.remainingSeconds) || EXAM_DURATION_SECONDS,
      0,
      EXAM_DURATION_SECONDS
    )
    state.startedAtIso =
      typeof payload.startedAtIso === 'string'
        ? payload.startedAtIso
        : new Date().toISOString()

    var updatedAt = Number(payload.updatedAt)
    if (Number.isFinite(updatedAt) && updatedAt > 0) {
      var elapsedSeconds = Math.floor((Date.now() - updatedAt) / 1000)
      if (elapsedSeconds > 0) {
        state.remainingSeconds = Math.max(
          0,
          state.remainingSeconds - elapsedSeconds
        )
      }
    }

    state.examActive = true
    state.submitted = false
    return true
  }

  function stopTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId)
      state.timerId = null
    }
  }

  function updateTimerDisplay() {
    var timer = byId('exam-timer')
    var note = byId('exam-timer-note')

    if (timer) {
      timer.textContent = formatClock(state.remainingSeconds)
      timer.classList.toggle(
        'pc-exam-timer--warning',
        state.remainingSeconds <= 300 && state.remainingSeconds > 60
      )
      timer.classList.toggle(
        'pc-exam-timer--danger',
        state.remainingSeconds <= 60
      )
    }

    if (note) {
      if (state.remainingSeconds <= 60) {
        note.textContent = 'Final minute. Submit now if you are done reviewing.'
      } else if (state.remainingSeconds <= 300) {
        note.textContent = 'Last 5 minutes remaining.'
      } else {
        note.textContent = 'Use Mark Question to return later from the grid.'
      }
    }
  }

  function startTimer() {
    stopTimer()
    updateTimerDisplay()

    state.timerId = window.setInterval(function () {
      if (!state.examActive || state.submitted) {
        stopTimer()
        return
      }

      state.remainingSeconds = Math.max(0, state.remainingSeconds - 1)
      updateTimerDisplay()
      persistSession()

      if (state.remainingSeconds <= 0) {
        stopTimer()
        submitExam('time')
      }
    }, 1000)
  }

  function setExamView(view) {
    var launch = byId('sim-launch')
    var shell = byId('exam-shell')
    var result = byId('exam-result')

    if (launch) {
      launch.hidden = view !== 'launch'
    }

    if (shell) {
      shell.hidden = view !== 'exam'
    }

    if (result) {
      result.hidden = view !== 'result'
    }
  }

  function renderQuestionGrid() {
    var grid = byId('exam-question-grid')
    if (!grid) {
      return
    }

    var html = state.questions
      .map(function (question, index) {
        var status = getQuestionStatus(index)
        var classes = ['pc-exam-grid-btn', 'pc-exam-grid-btn--' + status]
        var isCurrent = index === state.currentIndex
        var marked = isMarked(index)

        if (isCurrent) {
          classes.push('pc-is-current')
        }

        return (
          '' +
          '<button type="button" class="' +
          classes.join(' ') +
          '" data-nav-index="' +
          index +
          '"' +
          ' aria-label="Question ' +
          (index + 1) +
          ', ' +
          getQuestionStatusText(status) +
          '">' +
          '<span>' +
          (index + 1) +
          '</span>' +
          (marked
            ? '<span class="pc-exam-grid-flag" aria-hidden="true">M</span>'
            : '') +
          '</button>'
        )
      })
      .join('')

    grid.innerHTML = html
  }

  function renderSidebarStats() {
    var answered = byId('exam-answered-count')
    var marked = byId('exam-marked-count')
    var notDone = byId('exam-not-done-count')

    if (answered) {
      answered.textContent = String(getAnsweredCount())
    }
    if (marked) {
      marked.textContent = String(getMarkedCount())
    }
    if (notDone) {
      notDone.textContent = String(getNotDoneCount())
    }

    updateTimerDisplay()
  }

  function renderQuestionCard() {
    var container = byId('exam-question-container')
    if (!container || !state.questions.length) {
      return
    }

    var question = state.questions[state.currentIndex]
    var selected = state.answers[state.currentIndex]
    var optionsHtml = sortedOptionEntries(question)
      .map(function (entry) {
        var key = entry[0]
        var optionText = entry[1]
        var classes = ['pc-option-btn', 'pc-exam-option']

        if (selected === key) {
          classes.push('pc-exam-option--selected')
        }

        return (
          '' +
          '<button type="button" class="' +
          classes.join(' ') +
          '" data-option="' +
          escapeHtml(key) +
          '">' +
          '<span class="pc-option-key">' +
          escapeHtml(key) +
          '</span>' +
          '<span class="pc-option-text">' +
          escapeHtml(optionText) +
          '</span>' +
          '</button>'
        )
      })
      .join('')

    var markedChip = isMarked(state.currentIndex)
      ? '<span class="pc-question-topic pc-exam-question-chip pc-exam-question-chip--marked">Marked</span>'
      : '<span class="pc-question-topic pc-exam-question-chip">Unmarked</span>'

    container.innerHTML =
      '' +
      '<article class="pc-question-card">' +
      '<div class="pc-question-header">' +
      '<span class="pc-question-number">Question ' +
      (state.currentIndex + 1) +
      ' of ' +
      state.questions.length +
      '</span>' +
      '<span class="pc-question-topic">System: ' +
      escapeHtml(topicLabel(question.topic)) +
      '</span>' +
      markedChip +
      '</div>' +
      '<p class="pc-question-stem">' +
      escapeHtml(question.stem) +
      '</p>' +
      '<div class="pc-question-options">' +
      optionsHtml +
      '</div>' +
      '</article>'
  }

  function renderQuestionProgress() {
    var progress = byId('exam-question-progress')
    var prevBtn = byId('prev-question-btn')
    var nextBtn = byId('next-question-btn')
    var markBtn = byId('mark-question-btn')
    var clearBtn = byId('clear-answer-btn')
    var questionTotal = state.questions.length

    if (progress) {
      progress.textContent =
        'Question ' + (state.currentIndex + 1) + ' of ' + questionTotal
    }

    if (prevBtn) {
      prevBtn.disabled = state.currentIndex === 0
    }

    if (nextBtn) {
      nextBtn.disabled = state.currentIndex >= questionTotal - 1
    }

    if (markBtn) {
      markBtn.textContent = isMarked(state.currentIndex)
        ? 'Unmark Question'
        : 'Mark Question'
    }

    if (clearBtn) {
      clearBtn.disabled = !state.answers[state.currentIndex]
    }
  }

  function renderExam() {
    renderSidebarStats()
    renderQuestionGrid()
    renderQuestionCard()
    renderQuestionProgress()
    persistSession()
  }

  function moveToQuestion(index) {
    if (!state.questions.length) {
      return
    }

    state.currentIndex = clamp(index, 0, state.questions.length - 1)
    renderExam()
  }

  function selectOption(optionKey) {
    if (!state.questions.length) {
      return
    }

    state.answers[state.currentIndex] = String(optionKey || '').toUpperCase()
    renderExam()
  }

  function toggleMarkedCurrent() {
    if (!state.questions.length) {
      return
    }

    var nowMarked = !isMarked(state.currentIndex)
    setMarked(state.currentIndex, nowMarked)
    renderExam()
  }

  function clearCurrentAnswer() {
    if (!state.questions.length) {
      return
    }

    state.answers[state.currentIndex] = ''
    renderExam()
  }

  function resetForNewExam() {
    state.questions = state.allQuestions.slice(0, SIMULATOR_QUESTION_COUNT)
    state.answers = new Array(state.questions.length).fill('')
    state.marked = {}
    state.currentIndex = 0
    state.remainingSeconds = EXAM_DURATION_SECONDS
    state.examActive = true
    state.submitted = false
    state.startedAtIso = new Date().toISOString()
  }

  function startNewExam() {
    if (state.allQuestions.length < SIMULATOR_QUESTION_COUNT) {
      return
    }

    resetForNewExam()
    setExamView('exam')
    renderExam()
    startTimer()
    rememberLearningLocation()
  }

  function resumeExam() {
    setExamView('exam')
    renderExam()
    rememberLearningLocation()

    if (state.remainingSeconds <= 0) {
      submitExam('time')
      return
    }

    startTimer()
  }

  function buildResult() {
    var result = {
      total: state.questions.length,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      timeUsedSeconds: EXAM_DURATION_SECONDS - state.remainingSeconds,
      systemStats: [],
      reviewItems: [],
      correctQuestionNumbers: [],
    }

    var systems = {}
    var index

    for (index = 0; index < state.questions.length; index += 1) {
      var question = state.questions[index]
      var answer = state.answers[index] || ''
      var isCorrect = !!answer && answer === question.correct
      var topic = normalizeTopic(question.topic)

      if (!systems[topic]) {
        systems[topic] = {
          topic: topic,
          total: 0,
          correct: 0,
          wrong: 0,
          unanswered: 0,
          wrongQuestionNumbers: [],
        }
      }

      systems[topic].total += 1

      if (isCorrect) {
        result.correct += 1
        systems[topic].correct += 1
        result.correctQuestionNumbers.push(index + 1)
      } else if (answer) {
        result.incorrect += 1
        systems[topic].wrong += 1
        systems[topic].wrongQuestionNumbers.push(index + 1)
        result.reviewItems.push({
          number: index + 1,
          topic: topicLabel(question.topic),
          yourAnswer: answer,
          correctAnswer: question.correct,
          stem: question.stem,
          explanation: question.explanation,
        })
      } else {
        result.unanswered += 1
        systems[topic].unanswered += 1
        systems[topic].wrongQuestionNumbers.push(index + 1)
        result.reviewItems.push({
          number: index + 1,
          topic: topicLabel(question.topic),
          yourAnswer: 'Not answered',
          correctAnswer: question.correct,
          stem: question.stem,
          explanation: question.explanation,
        })
      }
    }

    result.systemStats = Object.keys(systems)
      .map(function (key) {
        return systems[key]
      })
      .sort(function (a, b) {
        if (b.total !== a.total) {
          return b.total - a.total
        }
        return a.topic.localeCompare(b.topic)
      })

    result.scorePercent = result.total
      ? (result.correct / result.total) * 100
      : 0
    return result
  }

  function renderResult(result, reason) {
    var score = byId('result-score')
    var correct = byId('result-correct-count')
    var incorrect = byId('result-incorrect-count')
    var unanswered = byId('result-unanswered-count')
    var timeUsed = byId('result-time-used')
    var summary = byId('result-summary-copy')
    var correctNumbers = byId('result-correct-numbers')
    var systems = byId('result-system-breakdown')
    var review = byId('result-review-list')

    if (score) {
      score.textContent = result.scorePercent.toFixed(1) + '%'
    }
    if (correct) {
      correct.textContent = result.correct + '/' + result.total
    }
    if (incorrect) {
      incorrect.textContent = String(result.incorrect)
    }
    if (unanswered) {
      unanswered.textContent = String(result.unanswered)
    }
    if (timeUsed) {
      timeUsed.textContent = formatClock(result.timeUsedSeconds)
    }
    if (summary) {
      summary.textContent =
        reason === 'time'
          ? 'Time ended. Your attempt was auto-submitted and evaluated by system.'
          : 'Submission complete. Review where you were correct and which systems need work.'
    }
    if (correctNumbers) {
      correctNumbers.textContent = result.correctQuestionNumbers.length
        ? result.correctQuestionNumbers.join(', ')
        : 'No correct answers yet in this attempt.'
    }

    if (systems) {
      systems.innerHTML = result.systemStats
        .map(function (stat) {
          var reviewText = stat.wrongQuestionNumbers.length
            ? stat.wrongQuestionNumbers.join(', ')
            : 'None'
          return (
            '' +
            '<article class="pc-exam-system-card">' +
            '<h4>' +
            escapeHtml(topicLabel(stat.topic)) +
            '</h4>' +
            '<p><strong>Correct:</strong> ' +
            stat.correct +
            ' / ' +
            stat.total +
            '</p>' +
            '<p><strong>Wrong:</strong> ' +
            stat.wrong +
            '</p>' +
            '<p><strong>Not Done:</strong> ' +
            stat.unanswered +
            '</p>' +
            '<p class="pc-text-small"><strong>Review:</strong> ' +
            escapeHtml(reviewText) +
            '</p>' +
            '</article>'
          )
        })
        .join('')
    }

    if (review) {
      if (!result.reviewItems.length) {
        review.innerHTML =
          '<p class="pc-text-small">All questions were correct. Strong pass for this 24-question block.</p>'
      } else {
        review.innerHTML = result.reviewItems
          .map(function (item) {
            var explanationHtml = item.explanation
              ? '<p class="pc-text-small"><strong>Why:</strong> ' +
                escapeHtml(item.explanation) +
                '</p>'
              : ''

            return (
              '' +
              '<article class="pc-exam-review-item">' +
              '<h4>Q' +
              item.number +
              ' - ' +
              escapeHtml(item.topic) +
              '</h4>' +
              '<p><strong>Your answer:</strong> ' +
              escapeHtml(item.yourAnswer) +
              '</p>' +
              '<p><strong>Correct answer:</strong> ' +
              escapeHtml(item.correctAnswer) +
              '</p>' +
              '<p class="pc-text-small">' +
              escapeHtml(item.stem) +
              '</p>' +
              explanationHtml +
              '</article>'
            )
          })
          .join('')
      }
    }
  }

  function submitExam(reason) {
    if (!state.examActive || state.submitted) {
      return
    }

    state.examActive = false
    state.submitted = true
    stopTimer()
    clearSession()

    var result = buildResult()
    renderResult(result, reason || 'manual')
    setExamView('result')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function attemptSubmit() {
    var notDone = getNotDoneCount()
    if (notDone > 0) {
      var shouldSubmit = window.confirm(
        'You still have ' + notDone + ' not done question(s). Submit anyway?'
      )
      if (!shouldSubmit) {
        return
      }
    }

    submitExam('manual')
  }

  function openComingSoonModal(modeLabel) {
    var modal = byId('coming-soon-modal')
    var copy = byId('coming-soon-copy')
    var closeBtn = byId('coming-soon-close-btn')

    if (!modal) {
      return
    }

    if (copy) {
      copy.textContent =
        'The ' +
        modeLabel +
        ' is coming soon. Right now, use the live 24-question mode while we build all six 60-question NAVLE blocks.'
    }

    modal.removeAttribute('hidden')
    if (closeBtn) {
      closeBtn.focus()
    }
  }

  function closeComingSoonModal() {
    var modal = byId('coming-soon-modal')
    if (!modal) {
      return
    }
    modal.setAttribute('hidden', '')
  }

  function setStartButtonsDisabled(disabled) {
    ;[
      byId('hero-start-btn'),
      byId('start-exam-24-btn'),
      byId('coming-soon-start-live-btn'),
    ].forEach(function (button) {
      if (button) {
        button.disabled = !!disabled
      }
    })
  }

  function setLaunchError(message) {
    var launch = byId('sim-launch')
    setStartButtonsDisabled(true)

    if (!launch) {
      return
    }

    var existing = launch.querySelector('.pc-calculator-warning')
    if (existing) {
      existing.textContent = message
      return
    }

    var warning = document.createElement('p')
    warning.className = 'pc-calculator-warning pc-calculator-warning--danger'
    warning.textContent = message
    launch.insertBefore(warning, launch.firstChild)
  }

  function appendToCalc(value) {
    var display = byId('calc-display')
    if (!display) {
      return
    }
    display.value += value
    display.focus()
  }

  function clearCalc() {
    var display = byId('calc-display')
    var result = byId('calc-result')
    if (display) {
      display.value = ''
    }
    if (result) {
      result.textContent = 'Result: -'
      result.classList.remove('pc-is-error')
    }
  }

  function backspaceCalc() {
    var display = byId('calc-display')
    if (!display || !display.value) {
      return
    }
    display.value = display.value.slice(0, -1)
    display.focus()
  }

  function evaluateCalc() {
    var display = byId('calc-display')
    var result = byId('calc-result')
    if (!display || !result) {
      return
    }

    var expression = String(display.value || '').trim()
    if (!expression) {
      result.textContent = 'Result: -'
      result.classList.remove('pc-is-error')
      return
    }

    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      result.textContent = 'Result: Invalid expression'
      result.classList.add('pc-is-error')
      return
    }

    try {
      var value = Function('"use strict"; return (' + expression + ');')()
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error('Invalid')
      }
      var normalized =
        Math.abs(value) < 1e12 ? value : Number(value.toPrecision(12))
      result.textContent = 'Result: ' + normalized
      result.classList.remove('pc-is-error')
    } catch (error) {
      result.textContent = 'Result: Invalid expression'
      result.classList.add('pc-is-error')
    }
  }

  function bindEvents() {
    var examContainer = byId('exam-question-container')
    var grid = byId('exam-question-grid')
    var startBtn = byId('start-exam-24-btn')
    var heroStartBtn = byId('hero-start-btn')
    var prevBtn = byId('prev-question-btn')
    var nextBtn = byId('next-question-btn')
    var markBtn = byId('mark-question-btn')
    var clearBtn = byId('clear-answer-btn')
    var submitBtn = byId('submit-exam-btn')
    var retakeBtn = byId('retake-exam-btn')
    var backBtn = byId('back-to-modes-btn')
    var calcPanel = byId('exam-calculator-panel')
    var calcToggle = byId('calc-toggle-btn')
    var calcDisplay = byId('calc-display')
    var modal = byId('coming-soon-modal')
    var modalClose = byId('coming-soon-close-btn')
    var modalDismiss = byId('coming-soon-dismiss-btn')
    var modalStartLive = byId('coming-soon-start-live-btn')
    var comingSoonButtons = document.querySelectorAll('[data-coming-soon]')

    function onStartClick() {
      startNewExam()
    }

    if (startBtn) {
      startBtn.addEventListener('click', onStartClick)
    }
    if (heroStartBtn) {
      heroStartBtn.addEventListener('click', onStartClick)
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        moveToQuestion(state.currentIndex - 1)
      })
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        moveToQuestion(state.currentIndex + 1)
      })
    }

    if (markBtn) {
      markBtn.addEventListener('click', toggleMarkedCurrent)
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', clearCurrentAnswer)
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', attemptSubmit)
    }

    if (retakeBtn) {
      retakeBtn.addEventListener('click', function () {
        startNewExam()
      })
    }

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        stopTimer()
        state.examActive = false
        state.submitted = false
        clearSession()
        setExamView('launch')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }

    if (examContainer) {
      examContainer.addEventListener('click', function (event) {
        var optionButton = event.target.closest('button[data-option]')
        if (!optionButton) {
          return
        }

        selectOption(optionButton.getAttribute('data-option'))
      })
    }

    if (grid) {
      grid.addEventListener('click', function (event) {
        var navButton = event.target.closest('button[data-nav-index]')
        if (!navButton) {
          return
        }

        moveToQuestion(Number(navButton.getAttribute('data-nav-index')))
      })
    }

    comingSoonButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var label = button.getAttribute('data-coming-soon') || 'simulator mode'
        openComingSoonModal(label)
      })
    })

    if (modalClose) {
      modalClose.addEventListener('click', closeComingSoonModal)
    }

    if (modalDismiss) {
      modalDismiss.addEventListener('click', closeComingSoonModal)
    }

    if (modalStartLive) {
      modalStartLive.addEventListener('click', function () {
        closeComingSoonModal()
        startNewExam()
      })
    }

    if (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target === modal) {
          closeComingSoonModal()
        }
      })
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeComingSoonModal()
      }
    })

    if (calcPanel) {
      calcPanel.addEventListener('click', function (event) {
        var key = event.target.closest('.pc-exam-calc-key')
        if (!key) {
          return
        }

        var action = key.getAttribute('data-calc-action')
        var value = key.getAttribute('data-calc-value')

        if (action === 'clear') {
          clearCalc()
          return
        }
        if (action === 'backspace') {
          backspaceCalc()
          return
        }
        if (action === 'evaluate') {
          evaluateCalc()
          return
        }
        if (value) {
          appendToCalc(value)
        }
      })
    }

    if (calcDisplay) {
      calcDisplay.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault()
          evaluateCalc()
        }
      })
    }

    if (calcToggle) {
      calcToggle.addEventListener('click', function () {
        var panel = byId('exam-calculator-panel')
        if (!panel) {
          return
        }

        var shouldShow = panel.hasAttribute('hidden')
        if (shouldShow) {
          panel.removeAttribute('hidden')
        } else {
          panel.setAttribute('hidden', '')
        }

        calcToggle.setAttribute('aria-expanded', shouldShow ? 'true' : 'false')
      })
    }
  }

  async function loadQuestions() {
    var response = await fetch(QUESTION_BANK_URL, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(
        'HTTP ' + response.status + ' while loading question bank.'
      )
    }

    var payload = await response.json()
    var questions = parseQuestions(payload)
    if (questions.length < SIMULATOR_QUESTION_COUNT) {
      throw new Error(
        'Question bank requires at least ' +
          SIMULATOR_QUESTION_COUNT +
          ' items.'
      )
    }

    return questions.slice(0, SIMULATOR_QUESTION_COUNT)
  }

  async function init() {
    if (!byId('sim-launch')) {
      return
    }

    bindEvents()
    setStartButtonsDisabled(true)
    setExamView('launch')
    rememberLearningLocation()

    try {
      state.allQuestions = await loadQuestions()
      setStartButtonsDisabled(false)
    } catch (error) {
      console.error('Failed to initialize NAVLE simulator:', error)
      setLaunchError(
        'Could not load the 24-question simulator right now. Please refresh and try again.'
      )
      return
    }

    var hasSavedSession = hydrateSavedSession()
    if (!hasSavedSession) {
      return
    }

    var resume = window.confirm(
      'Resume your in-progress 24-question simulator attempt?'
    )
    if (resume) {
      resumeExam()
      return
    }

    stopTimer()
    clearSession()
    state.examActive = false
    state.submitted = false
    setExamView('launch')
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      function () {
        init().catch(function () {
          // Keep page stable if initialization fails.
        })
      },
      { once: true }
    )
  } else {
    init().catch(function () {
      // Keep page stable if initialization fails.
    })
  }
})()
