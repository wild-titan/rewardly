const VERSION = "v2";
const CACHE_NAME = `period-tracker-${VERSION}`;

const assets = [
  "/rewardly/",
  "/rewardly/index.html",
  "/rewardly/style.css",
  "/rewardly/script.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of assets) {
        try {
          console.log("caching:", url);
          await cache.add(url);
        } catch (err) {
          console.error("cache failed:", url, err);
        }
      }
    })
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
