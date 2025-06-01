// src/service-worker.js

const CACHE_NAME = 'subx-cache-v1.3'; // Increment version for updates
const OFFLINE_URL = 'offline.html'; // Path to your custom offline page

// List of URLs to cache during service worker installation.
// Include all essential assets for the app shell.
const urlsToCache = [
  '/', // Cache the root (index.html)
  '/index.html', // Explicitly cache index.html
  '/manifest.json',
  // Add paths to your main JS bundles if known (e.g., '/static/js/bundle.js')
  // Add paths to your main CSS bundles if known
  // Add paths to critical font files
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
  // Add paths to icons (ensure these match your public/icons folder structure)
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-144x144.png',
  'icons/icon-152x152.png',
  'icons/icon-192x192.png',
  'icons/icon-384x384.png',
  'icons/icon-512x512.png',
  OFFLINE_URL // Cache the offline page itself
];

// Install event: opens a cache and adds core app files to it.
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] App shell cached successfully');
        return self.skipWaiting(); // Activate the new service worker immediately
      })
      .catch(error => {
        console.error('[ServiceWorker] Failed to cache app shell:', error);
      })
  );
});

// Activate event: cleans up old caches.
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[ServiceWorker] Activated successfully');
        return self.clients.claim(); // Take control of all open clients
    })
  );
});

// Fetch event: serves assets from cache or network, with offline fallback.
self.addEventListener('fetch', (event) => {
  // We only want to call event.respondWith() if this is a navigation request
  // for an HTML page.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported.
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Always try the network first for navigation requests.
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // catch is only triggered if an exception is thrown, which is likely
          // due to a network error.
          // If fetch() returns a valid HTTP response with a 4xx or 5xx status,
          // the catch() will NOT be called.
          console.log('[ServiceWorker] Fetch failed; returning offline page instead.', error);

          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  } else {
    // For non-navigation requests (assets like CSS, JS, images), use a cache-first strategy.
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return the cached response if found.
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in cache, fetch from network, cache it, and then return it.
        return fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }
          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return networkResponse;
        }).catch(error => {
            console.log('[ServiceWorker] Fetch failed for non-navigation request:', event.request.url, error);
            // Optionally, you could return a placeholder for images/assets here
        });
      })
    );
  }
});
