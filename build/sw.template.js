// Service worker de FrigoMalin. Ce modèle est complété au build par
// build/service-worker.ts : ne pas le charger tel quel.
const CACHE = "frigomalin-__VERSION__";
// Chemins relatifs à sw.js, donc au préfixe de publication (/FrigoMalin/).
const PRECACHE = __PRECACHE__;
const SHELL = "./";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("frigomalin-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Open Food Facts et toute autre requête externe passent directement par le réseau.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? networkFirst(request) : cacheFirst(request));
});

/** Coquille : version en ligne si possible, sinon celle du cache (routage par hash, ADR 0003). */
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && new URL(request.url).pathname === new URL(SHELL, self.location).pathname) {
      await cache.put(SHELL, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(SHELL, { ignoreVary: true });
    if (cached) return cached;
    throw error;
  }
}

/** Assets aux noms hachés : immuables, donc servis depuis le cache dès qu'ils y sont. */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  // ignoreVary : les scripts « crossorigin » envoient un en-tête Origin absent au préchargement.
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}
