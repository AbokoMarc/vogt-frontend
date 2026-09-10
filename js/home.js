/**
 * Homepage — tout le contenu (formations, actualités, événements, stats)
 * provient de l'API. Aucune donnée institutionnelle n'est écrite ici.
 */
document.addEventListener("DOMContentLoaded", () => {
  if (VogtAPI.isAuthenticated()) {
    const link = document.getElementById("navAuthLink");
    const role = VogtAPI.getRole();
    link.textContent = "Mon espace (" + VogtAPI.getEmail() + ")";
    link.href = role === "STUDENT" ? "etudiant.html" : role === "TEACHER" ? "enseignant.html" : "candidat.html";
  }

  loadPrograms();
  loadNews();
  loadEvents();
  loadStats();
  loadHeroCarousel();
  loadLabs();
  loadPartnersSection();
});

async function loadHeroCarousel() {
  const container = document.getElementById("heroCarousel");
  try {
    const items = await VogtAPI.getGallery("HERO");
    const images = (items || []).filter(i => i.mediaType === "IMAGE" && i.mediaUrl);
    if (images.length === 0) return; // Pas d'image CMS -> on garde le fond graphique par défaut.

    container.innerHTML = images.map((img, i) =>
      `<div class="slide ${i === 0 ? "active" : ""}" style="background-image:url('${img.mediaUrl}')"></div>`
    ).join("");

    if (images.length > 1) {
      const dotsWrap = document.createElement("div");
      dotsWrap.className = "carousel-dots";
      dotsWrap.innerHTML = images.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("");
      document.querySelector(".hero").appendChild(dotsWrap);

      let current = 0;
      setInterval(() => {
        const slides = container.querySelectorAll(".slide");
        const dots = dotsWrap.querySelectorAll("span");
        slides[current].classList.remove("active");
        dots[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
        dots[current].classList.add("active");
      }, 5000);
    }
  } catch (err) {
    // Pas grave — le fond graphique par défaut du hero reste affiché.
  }
}

async function loadLabs() {
  const grid = document.getElementById("labsGrid");
  try {
    const labs = await VogtAPI.getLabs();
    if (!labs || labs.length === 0) {
      grid.innerHTML = `<div class="empty-state">Aucun laboratoire publié pour le moment.</div>`;
      return;
    }
    grid.innerHTML = labs.map(l => `
      <div class="lab-card">
        <div class="lab-dot"></div>
        <h3>${escapeHtml(l.name)}</h3>
        <p>${escapeHtml(l.description || "")}</p>
      </div>`).join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Impossible de charger les laboratoires.</div>`;
  }
}

async function loadPartnersSection() {
  const strip = document.getElementById("partnersStrip");
  try {
    const partners = await VogtAPI.getPartners();
    if (!partners || partners.length === 0) {
      strip.innerHTML = `<div class="empty-state">Aucun partenaire publié pour le moment.</div>`;
      return;
    }
    strip.innerHTML = partners.map(p => p.logoUrl
      ? `<img class="partner-logo" src="${p.logoUrl}" alt="${escapeHtml(p.name)}" title="${escapeHtml(p.name)}">`
      : `<span class="partner-fallback">${escapeHtml(p.name)}</span>`
    ).join("");
  } catch (err) {
    strip.innerHTML = `<div class="empty-state">Impossible de charger les partenaires.</div>`;
  }
}

function categories() {
  const t = (k, fallback) => (window.VogtI18n && VogtI18n.getLang() === "en")
    ? { "": "All", INFORMATIQUE: "Computer Science", IA_DATA: "AI & Data", ELECTRONIQUE: "Electronics", ROBOTIQUE: "Robotics" }[k]
    : fallback;
  return [
    { key: "", label: t("", "Tous") },
    { key: "INFORMATIQUE", label: t("INFORMATIQUE", "Informatique") },
    { key: "IA_DATA", label: t("IA_DATA", "IA & Data") },
    { key: "ELECTRONIQUE", label: t("ELECTRONIQUE", "Électronique") },
    { key: "ROBOTIQUE", label: t("ROBOTIQUE", "Robotique") },
  ];
}

function renderProgramFilters(activeCategory, onSelect) {
  const container = document.getElementById("programFilters");
  container.innerHTML = "";
  categories().forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat.key === activeCategory ? " active" : "");
    btn.textContent = cat.label;
    btn.addEventListener("click", () => onSelect(cat.key));
    container.appendChild(btn);
  });
}

function t(key, fallback) {
  const lang = window.VogtI18n ? VogtI18n.getLang() : "fr";
  const dict = {
    empty_programs: { fr: "Aucune formation publiée pour le moment. Revenez bientôt.", en: "No programs published yet. Check back soon." },
    empty_news: { fr: "Aucun article publié pour le moment.", en: "No articles published yet." },
    empty_events: { fr: "Aucun événement programmé pour le moment.", en: "No events scheduled yet." },
    discover: { fr: "Découvrir →", en: "Discover →" },
  };
  return (dict[key] && dict[key][lang]) || fallback;
}

async function loadPrograms(category = "") {
  renderProgramFilters(category, loadPrograms);
  const grid = document.getElementById("programGrid");

  try {
    const programs = await VogtAPI.getPrograms(category || undefined);
    if (!programs || programs.length === 0) {
      grid.innerHTML = `<div class="empty-state">${t("empty_programs")}</div>`;
      return;
    }
    grid.innerHTML = programs.map(programCard).join("");
  } catch (err) {
    grid.innerHTML = errorState("Impossible de charger les formations pour le moment.", err);
  }
}

function programCard(p) {
  const tags = (p.tags || []).slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join(" ");
  return `
    <a class="prog-card" href="formation.html?slug=${encodeURIComponent(p.slug)}">
      <div class="prog-thumb"></div>
      <div class="prog-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.shortDescription || "")}</p>
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;">${tags}</div>
        <div class="prog-foot">
          <span class="duration">${escapeHtml(p.durationLabel || "")}</span>
          <span class="discover">${t("discover")}</span>
        </div>
      </div>
    </a>`;
}

let newsPage = 0;
const NEWS_PAGE_SIZE = 6;

async function loadNews() {
  const grid = document.getElementById("newsGrid");
  const loadMoreWrap = document.getElementById("newsLoadMoreWrap");
  try {
    const result = await VogtAPI.getNews(0, NEWS_PAGE_SIZE);
    const items = result && result.items ? result.items : [];
    newsPage = 0;
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state">${t("empty_news")}</div>`;
      loadMoreWrap.style.display = "none";
      return;
    }
    grid.innerHTML = items.map(newsCard).join("");
    const hasMore = result.totalPages && result.totalPages > 1;
    loadMoreWrap.style.display = hasMore ? "block" : "none";
    document.getElementById("newsLoadMoreBtn").onclick = loadMoreNews;
  } catch (err) {
    grid.innerHTML = errorState("Impossible de charger les actualités pour le moment.", err);
  }
}

async function loadMoreNews() {
  const btn = document.getElementById("newsLoadMoreBtn");
  btn.disabled = true;
  try {
    newsPage += 1;
    const result = await VogtAPI.getNews(newsPage, NEWS_PAGE_SIZE);
    const items = result && result.items ? result.items : [];
    document.getElementById("newsGrid").insertAdjacentHTML("beforeend", items.map(newsCard).join(""));
    if (!result.totalPages || newsPage >= result.totalPages - 1) {
      document.getElementById("newsLoadMoreWrap").style.display = "none";
    }
  } catch (err) {
    // silencieux — le bouton reste disponible pour reessayer
  } finally {
    btn.disabled = false;
  }
}

function newsCard(n) {
  const date = n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("fr-FR") : "";
  return `
    <a class="news-card" href="actualite.html?slug=${encodeURIComponent(n.slug)}">
      <div class="news-thumb"></div>
      <div class="news-body">
        <span class="news-cat">${escapeHtml(n.category || "")}</span>
        <h3>${escapeHtml(n.title)}</h3>
        <span class="news-meta">${date}${n.author ? " · " + escapeHtml(n.author) : ""}</span>
      </div>
    </a>`;
}

async function loadEvents() {
  const list = document.getElementById("eventsList");
  try {
    const events = await VogtAPI.getUpcomingEvents();
    if (!events || events.length === 0) {
      list.innerHTML = `<div class="empty-state">${t("empty_events")}</div>`;
      return;
    }
    list.innerHTML = events.map(eventRow).join("");
  } catch (err) {
    list.innerHTML = errorState("Impossible de charger les événements pour le moment.", err);
  }
}

function eventRow(e) {
  const date = e.startsAt ? new Date(e.startsAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";
  return `
    <div class="event-row">
      <div class="event-date">${date}</div>
      <div class="event-info">
        <h4>${escapeHtml(e.title)}</h4>
        <span>${escapeHtml(e.location || "")}</span>
      </div>
    </div>`;
}

async function loadStats() {
  const grid = document.getElementById("statsGrid");
  try {
    const [programs, projects, partners, events] = await Promise.all([
      VogtAPI.getPrograms(), VogtAPI.getStudentProjects(), VogtAPI.getPartners(), VogtAPI.getUpcomingEvents()
    ]);
    grid.innerHTML = `
      <div class="stat"><b>${(programs || []).length}</b><span>Formations publiées</span></div>
      <div class="stat"><b>${(projects || []).length}</b><span>Projets étudiants</span></div>
      <div class="stat"><b>${(partners || []).length}</b><span>Partenaires</span></div>
      <div class="stat"><b>${(events || []).length}</b><span>Événements à venir</span></div>`;
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Statistiques indisponibles pour le moment.</div>`;
  }
}

function errorState(message, err) {
  console.error(err);
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
