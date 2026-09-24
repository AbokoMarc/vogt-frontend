const CACHE_NAME = "vogt-campus-v2";
const STATIC_ASSETS = [
  "css/theme.css",
  "js/api.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// N'intercepte QUE les quelques fichiers precaches ci-dessus. Tout le reste —
// API, images (galerie, partenaires, photos de labs...), navigation entre
// pages — passe normalement par le reseau, jamais gere par le service worker.
// (Avant ce correctif, le SW interceptait TOUT et pouvait renvoyer `undefined`
// a event.respondWith() quand une image echouait sans etre en cache -> erreur
// "Failed to convert value to 'Response'" visible dans la console.)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isPrecached = STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset));
  if (!isPrecached) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Vraies notifications systeme (Web Push) — reçues meme app/onglet fermé.
self.addEventListener("push", (event) => {
  let data = { title: "VOGT HIGH TECH", body: "Vous avez une nouvelle notification." };
  try { data = event.data.json(); } catch (e) { /* payload texte simple */ }

  event.waitUntil(
    self.registration.showNotification(data.title || "VOGT HIGH TECH", {
      body: data.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
