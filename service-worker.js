/* global self, caches, clients, fetch */

const CACHE_VERSION = 'pc-phase4-offline-v2'
const RUNTIME_CACHE = 'pc-phase4-runtime-v2'
const APP_SHELL_CACHE = 'pc-phase4-shell-v2'
const BACKGROUND_SYNC_TAG = 'pc-phase4-sync'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/tools/',
  '/tools/fluid-calculator.html',
  '/tools/insulin-cri-planner.html',
  '/tools/ckd-aki-proteinuria-planner.html',
  '/tools/chf-staging-planner.html',
  '/bridge/',
  '/assets/css/tokens.css',
  '/assets/css/portal.css',
  '/assets/js/theme-toggle.js',
  '/assets/js/nav-status.js',
  '/assets/js/ckd-aki-proteinuria-planner.js',
  '/assets/js/integration-core.js',
  '/assets/js/case-integration.js',
  '/assets/img/vet-favicon.svg',
]

function isSameOrigin(requestUrl) {
  try {
    const url = new URL(requestUrl)
    return url.origin === self.location.origin
  } catch (error) {
    return false
  }
}

function isAssetRequest(pathname) {
  return (
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => Promise.resolve())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.map((key) => {
          if (key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key)
          }
          return Promise.resolve()
        })
      )
      await clients.claim()
    })()
  )
})

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    return caches.match('/index.html')
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response && response.status === 200) {
        const cache = await caches.open(RUNTIME_CACHE)
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    return cached
  }

  const fresh = await fetchPromise
  if (fresh) {
    return fresh
  }

  return caches.match('/index.html')
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (!request || request.method !== 'GET') {
    return
  }

  if (!isSameOrigin(request.url)) {
    return
  }

  const url = new URL(request.url)
  const pathname = url.pathname || '/'

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (isAssetRequest(pathname)) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  event.respondWith(networkFirst(request))
})

self.addEventListener('message', (event) => {
  if (!event || !event.data) {
    return
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

async function notifyClientsForSync() {
  const allClients = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })
  for (let i = 0; i < allClients.length; i += 1) {
    try {
      allClients[i].postMessage({ type: 'pc-phase4-sync-request' })
    } catch (error) {
      // Ignore per-client failures.
    }
  }
}

self.addEventListener('sync', (event) => {
  if (!event || !event.tag) {
    return
  }

  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(notifyClientsForSync())
  }
})
