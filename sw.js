/**
 * sw.js — Service Worker da AutoSov PWA
 * =======================================
 * Responsabilidades:
 *  - Fazer cache dos assets estáticos para funcionamento offline completo
 *  - Implementar estratégia "Cache-First com fallback para rede" nos assets
 *  - Implementar estratégia "Network-First" para requisições de API
 *  - Processar a fila de sincronização (Background Sync) quando a ligação é restaurada
 *
 * Versão: 0.31-async
 */

const CACHE_NAME    = "autosov-v2";
const SYNC_TAG      = "autosov-sync";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "assets/base.css",
  "assets/scripts/storage.js",
  "assets/scripts/tasks.js",
  "assets/scripts/script40.js",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

//  INSTALAÇÃO — pré-cache dos assets

self.addEventListener("install", (event) => {
  console.log("[SW] Instalando versão:", CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) 
  );
});

//  ACTIVAÇÃO — limpa caches antigos

self.addEventListener("activate", (event) => {
  console.log("[SW] Activando versão:", CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("[SW] A remover cache antigo:", key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

//  FETCH 

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(_networkFirst(event.request));
    return;
  }

  event.respondWith(_cacheFirst(event.request));
});

/**
  Cache-First: serve do cache; 
 */
async function _cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const offlineFallback = await caches.match("./");
    return offlineFallback || new Response("Offline — sem ligação à internet.", {
      status : 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

/**
 * Network-First; se falhar, serve do cache.
 */
async function _networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: "offline" }), {
      status : 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}

//  BACKGROUND SYNC — processa fila offline

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    console.log("[SW] Background Sync disparado:", SYNC_TAG);
    event.waitUntil(_processSyncQueue());
  }
});

async function _processSyncQueue() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach((client) => {
    client.postMessage({ type: "DRAIN_SYNC_QUEUE" });
  });
}
