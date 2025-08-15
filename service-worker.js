const CACHE_VERSION = 1;
const CACHE_NAME = `static-cache-v${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/404.html',
  '/service-worker.js',
];

// Install event – cache essential files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event – clean old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim(); 
});


self.addEventListener('fetch', (event) => {
  console.log('[ServiceWorker] Fetching:', event.request.url);

  if (event.request.method !== 'GET') return; 

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[ServiceWorker] Serving from cache:', event.request.url);
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          
          if (
            response.status === 200 &&
            response.type === 'basic' 
          ) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cloned);
            });
          }
          return response;
        })
        .catch((error) => {
          console.error('[ServiceWorker] Fetch failed:', error);
          
          throw error;
        });
    })
  );
});
