// FOLIO Service Worker v10.0.0 (FOLIO Branding & Custom Icon)
const CACHE_NAME = "folio-v10";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./frontend/icons/icon-192x192.png",
  "./frontend/icons/icon-512x512.png",
  "./frontend/js/api.js",
  "./frontend/js/websocket.js",
  "./frontend/js/geolocation.js"
];

// Install: Cache all core assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Cache addAll notice:", err);
      });
    })
  );
});

// Activate: Purge older caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-First with safe fallback to cached index.html for navigation
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip APIs & WebSockets
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ws/")) {
    return;
  }

  // Handle HTML navigation requests (app launch, page refresh)
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const match = await caches.match(event.request) ||
                        await caches.match("./index.html") ||
                        await caches.match("./") ||
                        await caches.match("index.html");
          if (match) return match;
          return new Response("Campus Portal Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        })
    );
    return;
  }

  // Handle other assets (CSS, JS, images)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      })
      .catch(async () => {
        return await caches.match(event.request);
      })
  );
});
