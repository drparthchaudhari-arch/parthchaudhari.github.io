;(function () {
  function getById(id) {
    return document.getElementById(id)
  }

  function setStatus(message, isError) {
    var node = getById('pc-leaderboard-status')
    if (!node) {
      return
    }

    node.textContent = message || ''
    node.classList.remove('pc-is-error')
    if (isError) {
      node.classList.add('pc-is-error')
    }
  }

  function getClient() {
    if (typeof window.getSupabaseClient !== 'function') {
      return null
    }
    return window.getSupabaseClient()
  }

  function isConfigured() {
    return (
      typeof window.isSupabaseConfigured === 'function' &&
      window.isSupabaseConfigured()
    )
  }

  function getSync() {
    return window.pcSync || null
  }

  function renderRows(rows) {
    var body = getById('pc-leaderboard-body')
    if (!body) {
      return
    }

    if (!rows || !rows.length) {
      body.innerHTML =
        '<tr><td colspan="5">No scores yet. Complete a practice question to appear here.</td></tr>'
      return
    }

    var html = ''
    for (var i = 0; i < rows.length; i += 1) {
      var row = rows[i]
      html += '<tr>'
      html += '<td>' + (i + 1) + '</td>'
      html += '<td>' + (row.display_name || 'Anonymous') + '</td>'
      html += '<td>' + (Number(row.total_completions) || 0) + '</td>'
      html += '<td>' + (Number(row.current_streak) || 0) + '</td>'
      html += '<td>' + (Number(row.weekly_score) || 0) + '</td>'
      html += '</tr>'
    }

    body.innerHTML = html
  }

  function renderUserRank(rank) {
    var node = getById('pc-my-rank')
    if (!node) {
      return
    }

    if (!rank) {
      node.textContent = 'Complete more practice questions to get ranked.'
      return
    }

    node.textContent = 'You are ranked #' + rank
  }

  async function loadUserRank(client, userId) {
    try {
      var response = await client
        .from('leaderboard')
        .select('user_id, weekly_score, updated_at')
        .order('weekly_score', { ascending: false })
        .order('updated_at', { ascending: false })

      if (response.error) {
        throw response.error
      }

      var rows = Array.isArray(response.data) ? response.data : []
      for (var i = 0; i < rows.length; i += 1) {
        if (rows[i].user_id === userId) {
          return i + 1
        }
      }
      return 0
    } catch (error) {
      return 0
    }
  }

  async function loadLeaderboard() {
    var rankCard = getById('pc-my-rank-card')
    if (rankCard) {
      rankCard.hidden = true
    }

    if (!isConfigured()) {
      renderRows([])
      setStatus(
        'Sync not configured yet. Leaderboard will appear after setup.',
        false
      )
      return
    }

    var client = getClient()
    if (!client) {
      renderRows([])
      setStatus(
        'Supabase client unavailable. Check configuration scripts.',
        true
      )
      return
    }

    setStatus('Loading leaderboard...', false)

    try {
      var response = await client
        .from('leaderboard')
        .select(
          'user_id, display_name, total_completions, current_streak, weekly_score, updated_at'
        )
        .order('weekly_score', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(10)

      if (response.error) {
        throw response.error
      }

      var rows = Array.isArray(response.data) ? response.data : []
      renderRows(rows)

      if (!rows.length) {
        setStatus('No scores posted yet.', false)
      } else {
        setStatus('Scores update when you complete practice questions.', false)
      }

      var sync = getSync()
      if (!sync || typeof sync.refreshCurrentUser !== 'function') {
        return
      }

      var user = await sync.refreshCurrentUser()
      if (!user || !user.id) {
        return
      }

      var rank = await loadUserRank(client, user.id)
      if (rankCard) {
        rankCard.hidden = false
      }
      renderUserRank(rank)
    } catch (error) {
      renderRows([])
      setStatus('Unable to load leaderboard right now. Try again later.', true)
    }
  }

  function init() {
    var root = getById('pc-leaderboard-root')
    if (!root) {
      return
    }

    loadLeaderboard()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
