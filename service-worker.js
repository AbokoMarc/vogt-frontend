const CACHE_NAME = "vogt-campus-v1";
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

// Reseau uniquement pour l'API (jamais de cache sur des donnees institutionnelles
// qui doivent toujours venir a jour) — cache-first pour les assets statiques.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.includes("/api/")) return;

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
