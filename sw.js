const CACHE_NAME = "allergikort-cache-v1";
const CORE = [
  "./",
  "./index.html",
  "./card.html",
  "./staff.html",
  "./common.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  e.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const res = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      // Cachea även externa resurser som QR-lib efter första hämtning (för offline senare)
      cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      // Offline fallback: om inget finns
      return cached || new Response("Offline och inget cacheat ännu.", { status: 503 });
    }
  })());
});
