const VERSION ="v1"

const CACHE_NAME = `period-tracker-${VERSION}`;

const assets = [
    "/",
    "/rewardly/index.html",
    "/rewardly/style.css",
    "/rewardly/script.js",
    "/rewardly/manifest.json",
    "/calendar-App/icons/icon-192.png",
    "/calendar-App/icons/icon-512.png"
]

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});