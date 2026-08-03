const CACHE_NAME = 'blanket-generator-v32';
const ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/firebaseConfig.js',
  'js/nativeBridge.js',
  'manifest.json',
  'icons/icon.svg'
];

// Install Event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - cache first, fallback to network with runtime caching for fonts & CDNs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle local assets and trusted CDNs/Fonts
  const isSameOrigin = url.origin === self.location.origin;
  const isTrustedCdn = url.hostname.includes('fonts.googleapis.com') ||
                       url.hostname.includes('fonts.gstatic.com') ||
                       url.hostname.includes('unpkg.com') ||
                       url.hostname.includes('cdnjs.cloudflare.com');

  if (!isSameOrigin && !isTrustedCdn) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return cachedResponse;
      });
    })
  );
});
