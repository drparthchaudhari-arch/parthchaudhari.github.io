;(function () {
  'use strict'

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

  function collectCaseCompletions() {
    var rawCompletion = '{}'
    try {
      rawCompletion = localStorage.getItem('pc_case_completion') || '{}'
    } catch (error) {
      rawCompletion = '{}'
    }
    var completions = safeParse(rawCompletion, {})

    if (
      completions &&
      typeof completions === 'object' &&
      Object.keys(completions).length
    ) {
      return completions
    }

    var fallback = {}
    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i)
        if (
          key &&
          key.indexOf('pc_case_') === 0 &&
          localStorage.getItem(key) === 'completed'
        ) {
          var dateKey = key + '_date'
          fallback[key.replace('pc_case_', '')] = {
            completedAt:
              localStorage.getItem(dateKey) || new Date().toISOString(),
          }
        }
      }
    } catch (error) {
      return {}
    }

    return fallback
  }

  function getStreakValue() {
    var rawStreak = '{"current":0}'
    try {
      rawStreak = localStorage.getItem('pc_streak') || '{"current":0}'
    } catch (error) {
      rawStreak = '{"current":0}'
    }
    var streak = safeParse(rawStreak, { current: 0 })
    if (streak && Number.isFinite(Number(streak.current))) {
      return Number(streak.current)
    }

    if (window.PCStorage && typeof window.PCStorage.getStreak === 'function') {
      var storageStreak = window.PCStorage.getStreak()
      return Number.isFinite(Number(storageStreak.current))
        ? Number(storageStreak.current)
        : 0
    }

    return 0
  }

  function getTodayProgress() {
    var todayKey = new Date().toISOString().split('T')[0]
    var raw = null
    try {
      raw = localStorage.getItem('pc_daily_' + todayKey)
    } catch (error) {
      raw = null
    }
    if (raw) {
      var parsed = safeParse(raw, {})
      if (parsed && Number.isFinite(Number(parsed.completedCount))) {
        return Number(parsed.completedCount)
      }
    }

    if (window.PCStorage && typeof window.PCStorage.getDaily === 'function') {
      var daily = window.PCStorage.getDaily(todayKey)
      if (daily && Number.isFinite(Number(daily.completedCount))) {
        return Number(daily.completedCount)
      }
    }

    return 0
  }

  function displayAccountData() {
    var completions = collectCaseCompletions()
    var completedKeys = Object.keys(completions)
    var completedCount = completedKeys.length
    var streakCurrent = getStreakValue()
    var todayProgress = getTodayProgress()

    var casesNode = byId('stat-cases')
    var streakNode = byId('stat-streak')
    var todayNode = byId('stat-today')

    if (casesNode) {
      casesNode.textContent = String(completedCount)
    }
    if (streakNode) {
      streakNode.textContent = String(streakCurrent)
    }
    if (todayNode) {
      todayNode.textContent = String(todayProgress)
    }

    var caseList = byId('completed-cases-list')
    if (caseList) {
      if (completedCount > 0) {
        caseList.innerHTML = completedKeys
          .map(function (key) {
            var item = completions[key]
            var completedAt =
              item && (item.completedAt || item.completed_at || item.date)
            var date = completedAt
              ? new Date(completedAt).toLocaleDateString()
              : 'Unknown date'
            return '<li>Case ' + key + ' - Completed ' + date + '</li>'
          })
          .join('')
      } else {
        caseList.innerHTML = '<li>No completed cases yet.</li>'
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayAccountData, {
      once: true,
    })
  } else {
    displayAccountData()
  }
})()
