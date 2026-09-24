/**
 * Mode clair / sombre — bouton injecté automatiquement dans le header de
 * chaque page (juste avant le menu mobile). Préférence mémorisée et
 * appliquée immédiatement au chargement suivant (pas de flash de thème).
 */
(function () {
  const KEY = "vogt_theme";

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function getPreferred() {
    return localStorage.getItem(KEY)
      || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  // Applique immediatement, avant meme le DOMContentLoaded, pour eviter un flash.
  apply(getPreferred());

  document.addEventListener("DOMContentLoaded", () => {
    const headerActions = document.querySelector(".header-actions");
    if (!headerActions) return;

    const btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Basculer le thème clair/sombre");
    btn.textContent = getPreferred() === "dark" ? "☀️" : "🌙";
    headerActions.insertBefore(btn, headerActions.firstChild);

    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      localStorage.setItem(KEY, next);
      btn.textContent = next === "dark" ? "☀️" : "🌙";
    });
  });
})();
