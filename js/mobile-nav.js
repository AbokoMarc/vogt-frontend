/**
 * Menu mobile partagé (tiroir translucide, ne recouvre pas toute la page).
 * S'appuie sur le nav.primary-nav et .header-actions déjà présents dans le
 * header de chaque page — aucune duplication de markup nécessaire ailleurs.
 */
document.addEventListener("DOMContentLoaded", () => {
  const headerActions = document.querySelector(".header-actions");
  const primaryNav = document.querySelector("nav.primary-nav");
  if (!headerActions || !primaryNav) return;

  const toggle = document.createElement("button");
  toggle.className = "icon-btn menu-toggle";
  toggle.setAttribute("aria-label", "Ouvrir le menu");
  toggle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  headerActions.appendChild(toggle);

  const backdrop = document.createElement("div");
  backdrop.className = "mobile-nav-backdrop";

  const drawer = document.createElement("div");
  drawer.className = "mobile-nav-drawer";

  const navLinks = Array.from(primaryNav.querySelectorAll("a"))
    .map(a => `<a href="${a.getAttribute("href")}">${a.textContent}</a>`).join("");

  const actionLinks = Array.from(headerActions.querySelectorAll("a.btn"))
    .map(a => `<a href="${a.getAttribute("href")}" class="btn ${a.classList.contains("btn-accent") ? "btn-accent" : "btn-outline"}" style="color:${a.classList.contains("btn-accent") ? "#fff" : "#fff"}; border-color:rgba(255,255,255,.3);">${a.textContent}</a>`).join("");

  drawer.innerHTML = `
    <div class="mnav-top">
      <button class="icon-btn" id="mobileNavClose" aria-label="Fermer" style="color:#fff;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    ${navLinks}
    <div class="mnav-actions">${actionLinks}</div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  function openDrawer() { backdrop.classList.add("open"); drawer.classList.add("open"); }
  function closeDrawer() { backdrop.classList.remove("open"); drawer.classList.remove("open"); }

  toggle.addEventListener("click", openDrawer);
  backdrop.addEventListener("click", closeDrawer);
  drawer.querySelector("#mobileNavClose").addEventListener("click", closeDrawer);
  drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", closeDrawer));
});
