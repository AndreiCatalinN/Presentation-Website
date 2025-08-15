const CACHE_VERSION = 1;
const CACHE_NAME = `static-cache-v${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  './index.html',
  './style.css',
  './404.html',
  './service-worker.js',
];

function sendMessageToClient(clientId, msg) {
  clients.get(clientId).then(client => {
    if (client) client.postMessage(msg);
  });
}


self.addEventListener('install', (event) => {

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {

      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event – clean old caches
self.addEventListener('activate', (event) => {
  
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim(); 
});


self.addEventListener('fetch', (event) => {
  

  if (event.request.method !== 'GET') return; 

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        sendMessageToClient(event.clientId, {
          type: 'CACHE_HIT',
          url: event.request.url
        });
        
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
