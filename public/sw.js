const CACHE_VERSION = 'tyana-v4';

// Install - activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate - delete old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== CACHE_VERSION)
          .map((n) => {
            console.log('Deleting old cache:', n);
            return caches.delete(n);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch - network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Never cache API / external calls
  if (
    event.request.url.includes('/functions/v1/') ||
    event.request.url.includes('supabase') ||
    event.request.url.includes('openai') ||
    event.request.url.includes('stripe')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML navigation - network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets - stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
        return cached || networkFetch;
      })
    )
  );
});
