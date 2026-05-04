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

// Assets estáticos a colocar em cache no momento da instalação
const STATIC_ASSETS = [
  "./",
  "./No4F4P_AutoSov_0.4.html",
  "assets/style.css",
  "assets/scripts/storage.js",
  "assets/scripts/tasks.js",
  "assets/scripts/script40.js",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

// ─────────────────────────────────────────────
//  INSTALAÇÃO — pré-cache dos assets estáticos
// ─────────────────────────────────────────────

self.addEventListener("install", (event) => {
  console.log("[SW] Instalando versão:", CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // activa imediatamente sem esperar pelo fecho de abas
  );
});

// ─────────────────────────────────────────────
//  ACTIVAÇÃO — limpa caches antigos
// ─────────────────────────────────────────────

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
    ).then(() => self.clients.claim()) // assume controlo de todas as abas imediatamente
  );
});

// ─────────────────────────────────────────────
//  FETCH — estratégia de resposta a pedidos
// ─────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignora pedidos que não sejam GET (POST, PUT, DELETE vão para a sync queue)
  if (event.request.method !== "GET") return;

  // Estratégia Network-First para pedidos de API (URLs com /api/)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(_networkFirst(event.request));
    return;
  }

  // Estratégia Cache-First para todos os outros assets estáticos
  event.respondWith(_cacheFirst(event.request));
});

/**
 * Cache-First: serve do cache; se não existir, vai à rede e guarda no cache.
 * Ideal para assets estáticos (CSS, JS, imagens).
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
    // Sem rede e sem cache — retorna página offline genérica se disponível
    const offlineFallback = await caches.match("./");
    return offlineFallback || new Response("Offline — sem ligação à internet.", {
      status : 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

/**
 * Network-First: tenta a rede; se falhar, serve do cache.
 * Ideal para dados dinâmicos (API calls).
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

// ─────────────────────────────────────────────
//  BACKGROUND SYNC — processa fila offline
// ─────────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    console.log("[SW] Background Sync disparado:", SYNC_TAG);
    event.waitUntil(_processSyncQueue());
  }
});

/**
 * Processa as operações pendentes na syncQueue do IndexedDB.
 * Envia uma mensagem para o cliente activo para que este execute a drenagem
 * (o Service Worker não tem acesso directo ao AutoSovDB do cliente).
 */
async function _processSyncQueue() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach((client) => {
    client.postMessage({ type: "DRAIN_SYNC_QUEUE" });
  });
}
