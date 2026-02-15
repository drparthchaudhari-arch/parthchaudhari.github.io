;(function () {
  const TODAY_TASK_COUNT = 3

  function init() {
    if (!window.PCStorage) {
      console.error('Storage not loaded')
      return
    }

    updateDateDisplay()
    updateStreakDisplay()
    loadAndRenderTasks()
  }

  function updateDateDisplay() {
    const dateEl = document.getElementById('today-date')
    const todayKey = PCStorage.getTodayKey()
    const date = new Date()
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    dateEl.textContent = date.toLocaleDateString('en-US', options)
  }

  function updateStreakDisplay() {
    const streak = PCStorage.getStreak()
    const countEl = document.getElementById('streak-count')
    countEl.textContent = streak.current

    // Add animation if streak increased
    if (streak.current > 0) {
      countEl.classList.add('pc-streak-pulse')
    }
  }

  async function loadAndRenderTasks() {
    try {
      // Load tasks index
      const response = await fetch('/assets/study/tasks.json')
      const data = await response.json()

      const todayKey = PCStorage.getTodayKey()
      const daily = PCStorage.getDaily(todayKey)

      // Generate tasks if not exists
      if (!daily.tasks || daily.tasks.length === 0) {
        daily.tasks = generateTasks(data.topics, todayKey)
        PCStorage.setDaily(todayKey, daily)
      }

      renderTasks(daily.tasks, daily.completedCount || 0)
      updateProgress(daily.completedCount || 0, daily.tasks.length)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      document.getElementById('today-tasks').innerHTML =
        '<p class="pc-error">Failed to load tasks. Please refresh.</p>'
    }
  }

  function generateTasks(allTopics, dateKey) {
    // Deterministic shuffle based on date
    const seed = dateKey.replace(/-/g, '')
    const shuffled = shuffleWithSeed([...allTopics], seed)

    // Pick 3 diverse tasks
    const selected = []
    const categories = new Set()

    for (const topic of shuffled) {
      if (selected.length >= TODAY_TASK_COUNT) break

      // Try to get diversity
      if (!categories.has(topic.category) || selected.length < 2) {
        selected.push({
          ...topic,
          taskId: `${topic.id}_${dateKey}`,
          completed: false,
        })
        categories.add(topic.category)
      }
    }

    return selected
  }

  function shuffleWithSeed(array, seed) {
    // Simple seeded random shuffle
    const rng = seededRandom(seed)
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  function seededRandom(seed) {
    let value = parseInt(seed, 10) || 1
    return function () {
      value = (value * 9301 + 49297) % 233280
      return value / 233280
    }
  }

  function renderTasks(tasks, completedCount) {
    const container = document.getElementById('today-tasks')

    if (tasks.length === 0) {
      container.innerHTML = '<p>No tasks available.</p>'
      return
    }

    container.innerHTML = tasks
      .map(
        (task, index) => `
      <div class="pc-task-card ${task.completed ? 'pc-task-card--completed' : ''}" data-task-id="${task.taskId}">
        <div class="pc-task-header">
          <span class="pc-task-number">${index + 1}</span>
          <span class="pc-task-category">${task.category}</span>
          <span class="pc-task-time">${task.estimatedTime} min</span>
        </div>
        <h3 class="pc-task-title">${task.title}</h3>
        <p class="pc-task-type">${task.type === 'case' ? 'Practice Question' : 'Learning Game'}</p>
        <div class="pc-task-actions">
          ${
            task.completed
              ? '<span class="pc-task-complete-badge">✓ Completed</span>'
              : `<a href="${task.url}" class="pc-btn pc-btn--primary" onclick="completeTask('${task.taskId}')">Start Task</a>`
          }
        </div>
      </div>
    `
      )
      .join('')

    // Check for study break suggestion
    if (completedCount >= 2) {
      document.getElementById('study-break').hidden = false
    }

    // Check for all complete
    if (completedCount >= tasks.length) {
      document.getElementById('completion-celebration').hidden = false
      celebrateStreak()
    }
  }

  function updateProgress(completed, total) {
    document.getElementById('completed-count').textContent = completed
    document.getElementById('remaining-count').textContent = Math.max(
      0,
      total - completed
    )
  }

  window.completeTask = function (taskId) {
    // This is called when user clicks Start Task
    // Actual completion happens when they finish the case/game
    // For now, mark as started
    console.log('Started task:', taskId)
  }

  window.markTaskComplete = function (taskId) {
    const todayKey = PCStorage.getTodayKey()
    const daily = PCStorage.getDaily(todayKey)

    const task = daily.tasks.find((t) => t.taskId === taskId)
    if (task && !task.completed) {
      task.completed = true
      daily.completedCount = (daily.completedCount || 0) + 1
      daily.lastActivityAt = new Date().toISOString()

      PCStorage.setDaily(todayKey, daily)

      // Update streak
      PCStorage.updateStreak(todayKey)

      // Re-render
      loadAndRenderTasks()
    }
  }

  if (window.PCStorage) {
    window.PCStorage.markTaskComplete = window.markTaskComplete
  }

  function celebrateStreak() {
    const streak = PCStorage.getStreak()
    const message = document.getElementById('streak-message')

    if (streak.current > 1) {
      message.textContent = `You're on a ${streak.current}-day streak! Keep it up! 🔥`
    } else {
      message.textContent =
        'Great start! Come back tomorrow to build your streak.'
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', init)
})()
