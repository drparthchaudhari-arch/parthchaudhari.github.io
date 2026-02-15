;(function () {
  'use strict'

  document.addEventListener('DOMContentLoaded', loadLeaderboard)

  async function loadLeaderboard() {
    var container = document.getElementById('pc-leaderboard-body')
    if (!container) {
      return
    }

    try {
      if (!isSupabaseReady()) {
        showEmptyState(
          'Leaderboard unavailable in local mode. Log in to participate.'
        )
        return
      }

      var supabase = getSupabaseClient()
      if (!supabase) {
        showEmptyState(
          'Leaderboard client unavailable. Please refresh and try again.'
        )
        return
      }

      var response = await supabase
        .from('leaderboard')
        .select('display_name, weekly_score, current_streak, total_completions')
        .order('weekly_score', { ascending: false })
        .limit(10)

      if (response.error) {
        throw response.error
      }

      var data = Array.isArray(response.data) ? response.data : []
      if (!data.length) {
        showEmptyState(
          'No scores yet. Be the first to complete a practice question!'
        )
        return
      }

      var emptyState = document.getElementById('pc-leaderboard-empty')
      if (emptyState) {
        emptyState.hidden = true
      }

      container.innerHTML = data
        .map(function (row, index) {
          var rank = index + 1
          return [
            '<tr class="pc-leaderboard-row ' +
              (index < 3 ? 'pc-leaderboard-top' : '') +
              '">',
            '<td class="pc-leaderboard-rank" data-label="Rank">#' +
              rank +
              '</td>',
            '<td class="pc-leaderboard-name" data-label="Display Name">' +
              escapeHtml(row.display_name || 'Anonymous') +
              '</td>',
            '<td class="pc-leaderboard-completions" data-label="Cases Completed">' +
              Number(row.total_completions || 0) +
              '</td>',
            '<td class="pc-leaderboard-streak" data-label="Current Streak">' +
              Number(row.current_streak || 0) +
              ' days</td>',
            '<td class="pc-leaderboard-score" data-label="Weekly Score">' +
              Number(row.weekly_score || 0) +
              '</td>',
            '</tr>',
          ].join('')
        })
        .join('')

      await showUserRank(supabase)
    } catch (error) {
      console.error('Leaderboard error:', error)
      showEmptyState('Unable to load leaderboard. Please try again later.')
    }
  }

  function isSupabaseReady() {
    var hasSupabase = typeof window.supabase !== 'undefined'
    var configured =
      typeof window.isSupabaseConfigured === 'function'
        ? window.isSupabaseConfigured()
        : !!(
            window.SUPABASE_CONFIG &&
            window.SUPABASE_CONFIG.url &&
            window.SUPABASE_CONFIG.anonKey
          )
    return hasSupabase && configured
  }

  function getSupabaseClient() {
    if (typeof window.getSupabaseClient === 'function') {
      return window.getSupabaseClient()
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== 'function' ||
      !window.SUPABASE_CONFIG
    ) {
      return null
    }

    return window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    )
  }

  function showEmptyState(message) {
    var container = document.getElementById('pc-leaderboard-body')
    var emptyState = document.getElementById('pc-leaderboard-empty')
    var userRank = document.getElementById('pc-user-rank')

    if (container) {
      container.innerHTML = ''
    }
    if (userRank) {
      userRank.innerHTML = ''
    }
    if (emptyState) {
      emptyState.hidden = false
      emptyState.textContent = message
    }
  }

  async function showUserRank(supabase) {
    if (!window.pcSync || typeof window.pcSync.getCurrentUser !== 'function') {
      return
    }

    var user = window.pcSync.getCurrentUser()
    if (!user && typeof window.pcSync.refreshCurrentUser === 'function') {
      user = await window.pcSync.refreshCurrentUser()
    }
    if (!user) {
      return
    }

    try {
      var userResult = await supabase
        .from('leaderboard')
        .select('weekly_score')
        .eq('user_id', user.id)
        .maybeSingle()

      if (userResult.error || !userResult.data) {
        return
      }

      var rankResult = await supabase
        .from('leaderboard')
        .select('id', { count: 'exact', head: true })
        .gt('weekly_score', userResult.data.weekly_score || 0)

      if (rankResult.error) {
        return
      }

      var rank = Number(rankResult.count || 0) + 1
      var userRankDiv = document.getElementById('pc-user-rank')
      if (userRankDiv) {
        userRankDiv.innerHTML =
          '<p>You are ranked <strong>#' + rank + '</strong> this week.</p>'
      }
    } catch (error) {
      console.error('Error fetching user rank:', error)
    }
  }

  function escapeHtml(text) {
    var div = document.createElement('div')
    div.textContent = String(text || '')
    return div.innerHTML
  }
})()
