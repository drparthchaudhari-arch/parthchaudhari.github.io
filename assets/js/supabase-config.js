;(function () {
  window.SUPABASE_CONFIG = {
    url: 'https://yrkfpvicsnmasvznuqmx.supabase.co',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2Zwdmljc25tYXN2em51cW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MzQ0NDYsImV4cCI6MjA4NjUxMDQ0Nn0.Y27T6YtilrBjV-d82UVnGLZBhwRKtTbSRSpYCQBaREY',
  }

  var supabaseClient = null
  var hasLoggedMissingConfig = false
  var hasLoggedMissingLibrary = false

  function readConfig() {
    if (!window.SUPABASE_CONFIG || typeof window.SUPABASE_CONFIG !== 'object') {
      return null
    }

    var url = String(window.SUPABASE_CONFIG.url || '').trim()
    var anonKey = String(window.SUPABASE_CONFIG.anonKey || '').trim()

    if (!url || !anonKey) {
      return null
    }

    return {
      url: url,
      anonKey: anonKey,
    }
  }

  function isSupabaseConfigured() {
    return !!readConfig()
  }

  function getSupabaseClient() {
    if (supabaseClient) {
      return supabaseClient
    }

    var config = readConfig()
    if (!config) {
      if (!hasLoggedMissingConfig) {
        console.log('Sync not configured')
        hasLoggedMissingConfig = true
      }
      return null
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== 'function'
    ) {
      if (!hasLoggedMissingLibrary) {
        console.log('Supabase library not loaded')
        hasLoggedMissingLibrary = true
      }
      return null
    }

    try {
      supabaseClient = window.supabase.createClient(
        config.url,
        config.anonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }
      )
      return supabaseClient
    } catch (error) {
      return null
    }
  }

  window.getSupabaseClient = getSupabaseClient
  window.isSupabaseConfigured = isSupabaseConfigured
  window.pcSupabase = {
    getSupabaseClient: getSupabaseClient,
    isSupabaseConfigured: isSupabaseConfigured,
  }

  // Stage 1 placeholder example:
  // window.SUPABASE_CONFIG = { url: 'https://your-project.supabase.co', anonKey: 'your-anon-key' };
})()
