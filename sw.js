// MyMonitorXX Service Worker v7.0.0 (Cloud Firestore Real-Time Multi-Device Sync)
const CACHE_NAME = "mymonitorxx-v7";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./frontend/manifest.json",
  "./frontend/icons/icon-192x192.png",
  "./frontend/icons/icon-512x512.png",
  "./frontend/js/api.js",
  "./frontend/js/websocket.js",
  "./frontend/js/geolocation.js"
];

// Install: Skip waiting immediately to activate fresh worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: Purge all old caches (including mymonitorxx-v1) and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log("[ServiceWorker] Purging stale cache:", k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-First strategy (always get fresh HTML/JS from Vercel, fallback to cache if offline)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always pass API and WebSocket calls directly to network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ws/")) {
    return;
  }

  // Network-First for HTML, JS, and CSS so mobile users always get newest code
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html");
          }
        });
      })
  );
});

