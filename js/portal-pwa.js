/**
 * A inclure UNIQUEMENT sur etudiant.html, enseignant.html, admin.html.
 * Ne jamais inclure sur les pages publiques ou l'espace candidat : le
 * prompt d'installation PWA et les notifications push sont réservés au
 * personnel et aux étudiants connectés, jamais proposés aux visiteurs.
 */
(function () {
  let deferredInstallPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallButton();
  });

  function showInstallButton() {
    if (document.getElementById("pwaInstallBtn")) return;
    const btn = document.createElement("button");
    btn.id = "pwaInstallBtn";
    btn.className = "btn btn-outline btn-sm";
    btn.textContent = "📲 Installer l'application";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = "150";
    btn.style.background = "#fff";
    btn.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      btn.remove();
    });
    document.body.appendChild(btn);
  }

  async function registerServiceWorkerAndPush() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" });

      if (!("PushManager" in window) || !VogtAPI.isAuthenticated()) return;

      const { publicKey } = await VogtAPI_fetchVapidKey();
      if (!publicKey) return; // Push non configuré côté serveur (pas de clés VAPID) — on ignore silencieusement.

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await VogtAPI_subscribePush(subscription);
    } catch (err) {
      console.warn("Notifications push non disponibles :", err);
    }
  }

  async function VogtAPI_fetchVapidKey() {
    const res = await fetch((window.VOGT_API_BASE_URL || "http://localhost:8080/api/v1") + "/notifications/push/vapid-public-key", {
      headers: { Authorization: "Bearer " + localStorage.getItem("vogt_access_token") },
    });
    const json = await res.json();
    return json.data || {};
  }

  async function VogtAPI_subscribePush(subscription) {
    await fetch((window.VOGT_API_BASE_URL || "http://localhost:8080/api/v1") + "/notifications/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("vogt_access_token"),
      },
      body: JSON.stringify(subscription),
    });
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  document.addEventListener("DOMContentLoaded", registerServiceWorkerAndPush);
})();
