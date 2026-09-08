const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "ADMISSIONS_OFFICER", "ACADEMIC_ADMIN", "COMMUNICATION_ADMIN"];

document.addEventListener("DOMContentLoaded", async () => {
  if (!VogtAPI.isAuthenticated() || !ADMIN_ROLES.includes(VogtAPI.getRole())) {
    document.getElementById("gate").style.display = "block";
    return;
  }

  document.getElementById("shell").style.display = "grid";
  document.getElementById("userBadge").textContent = VogtAPI.getEmail() + " · " + VogtAPI.getRole();

  const sidebar = document.querySelector(".admin-sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  document.getElementById("sidebarToggle").addEventListener("click", () => {
    sidebar.classList.add("open");
    sidebarBackdrop.classList.add("open");
  });
  sidebarBackdrop.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("open");
  });
  document.querySelectorAll(".admin-nav a").forEach(a => a.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("open");
  }));

  document.getElementById("logoutLink").addEventListener("click", (e) => {
    e.preventDefault();
    VogtAPI.logout();
    window.location.href = "admin-login.html";
  });

  document.querySelectorAll(".admin-nav a[data-panel]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".admin-nav a").forEach(l => l.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
      link.classList.add("active");
      document.getElementById("panel-" + link.dataset.panel).classList.add("active");
      document.getElementById("pageTitle").textContent = link.textContent.trim().replace(/^\S+\s/, "");
    });
  });

  document.getElementById("newProgramBtn").addEventListener("click", () => openProgramModal());
  document.getElementById("newNewsBtn").addEventListener("click", () => openNewsModal());
  document.getElementById("newEventBtn").addEventListener("click", () => openEventModal());
  document.getElementById("newYearBtn").addEventListener("click", () => openYearModal());
  document.getElementById("newLabBtn").addEventListener("click", () => openLabModal());
  document.getElementById("newPartnerBtn").addEventListener("click", () => openPartnerModal());
  document.getElementById("newGalleryBtn").addEventListener("click", () => openGalleryModal());
  document.getElementById("newFaqBtn").addEventListener("click", () => openFaqModal());
  document.getElementById("newProjectBtn").addEventListener("click", () => openProjectModal());
  document.getElementById("newInvoiceBtn").addEventListener("click", () => openInvoiceModal());
  document.getElementById("setup2faBtn").addEventListener("click", () => setup2fa());
  document.getElementById("newTeacherBtn").addEventListener("click", () => openTeacherModal());
  document.getElementById("newStudentBtn").addEventListener("click", () => openStudentModal());
  document.getElementById("newAdminBtn").addEventListener("click", () => openAdminAccountModal());

  document.getElementById("changePwdForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const box = document.getElementById("pwdMsg");
    box.innerHTML = "";
    try {
      await VogtAPI.changePassword(document.getElementById("currentPwd").value, document.getElementById("newPwd").value);
      box.innerHTML = `<div class="alert alert-success">Mot de passe mis à jour.</div>`;
      e.target.reset();
    } catch (err) {
      box.innerHTML = `<div class="alert alert-error">${err.message || "Impossible de mettre à jour le mot de passe."}</div>`;
    }
  });

  document.getElementById("modalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") closeModal();
  });

  await loadOverview();
  await loadPrograms();
  await loadNews();
  await loadEvents();
  await loadYears();
  await loadLabs();
  await loadApplications();
  await loadPartners();
  await loadGallery();
  await loadFaq();
  await loadProjects();
  await loadPayments();
  await loadAuditLogs();
  await loadTeachers();
  await loadStudentsAccounts();
  await loadAdminAccounts();
});

/* ---------------- Overview ---------------- */
async function loadOverview() {
  const grid = document.getElementById("overviewGrid");
  try {
    const stats = await VogtAPI.admin.overview();
    const labels = { students: "Étudiants", applications: "Candidatures", teachers: "Enseignants", programs: "Formations", events: "Événements" };
    grid.innerHTML = Object.entries(stats).map(([key, value]) => `
      <div class="kpi"><b>${value}</b><span>${labels[key] || key}</span></div>`).join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Impossible de charger les statistiques.</div>`;
  }
}

/* ---------------- Formations ---------------- */
let programsCache = [];

async function loadPrograms() {
  const el = document.getElementById("programsTable");
  try {
    programsCache = await VogtAPI.admin.listPrograms();
    if (programsCache.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucune formation. Créez la première.</div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <tr><th>Nom</th><th>Catégorie</th><th>Durée</th><th>Statut</th><th>Actions</th></tr>
        ${programsCache.map(p => `
          <tr>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.category || "—")}</td>
            <td>${escapeHtml(p.durationLabel || "—")}</td>
            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
            <td class="row-actions">
              <button onclick="openProgramModal('${p.id}')">Modifier</button>
              ${p.status !== "PUBLISHED" ? `<button onclick="programAction('${p.id}','publish')">Publier</button>` : `<button onclick="programAction('${p.id}','unpublish')">Dépublier</button>`}
              <button onclick="programAction('${p.id}','archive')">Archiver</button>
            </td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les formations. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

async function programAction(id, action) {
  try {
    if (action === "publish") await VogtAPI.admin.publishProgram(id);
    if (action === "unpublish") await VogtAPI.admin.unpublishProgram(id);
    if (action === "archive") await VogtAPI.admin.archiveProgram(id);
    showMessage("Formation mise à jour.", "success");
    await loadPrograms();
  } catch (err) {
    showMessage(err.message || "Action impossible.", "error");
  }
}

function openProgramModal(id) {
  const program = id ? programsCache.find(p => p.id === id) : null;
  openModal(program ? "Modifier la formation" : "Nouvelle formation", `
    <div class="form-row">
      <div class="field"><label>Nom</label><input name="name" required value="${program ? escapeAttr(program.name) : ""}"></div>
      <div class="field"><label>Slug (URL)</label><input name="slug" required value="${program ? escapeAttr(program.slug) : ""}" placeholder="genie-logiciel"></div>
    </div>
    <div class="form-row">
      <div class="field"><label>Catégorie</label>
        <select name="category">
          <option value="INFORMATIQUE" ${program?.category === "INFORMATIQUE" ? "selected" : ""}>Informatique</option>
          <option value="IA_DATA" ${program?.category === "IA_DATA" ? "selected" : ""}>IA & Data</option>
          <option value="ELECTRONIQUE" ${program?.category === "ELECTRONIQUE" ? "selected" : ""}>Électronique</option>
          <option value="ROBOTIQUE" ${program?.category === "ROBOTIQUE" ? "selected" : ""}>Robotique</option>
        </select>
      </div>
      <div class="field"><label>Durée</label><input name="durationLabel" value="${program ? escapeAttr(program.durationLabel) : "5 ans"}"></div>
    </div>
    <div class="field"><label>Description courte</label><textarea name="shortDescription" rows="2">${program ? escapeHtml(program.shortDescription || "") : ""}</textarea></div>
    <div class="field"><label>Description complète</label><textarea name="fullDescription" rows="4">${program ? escapeHtml(program.fullDescription || "") : ""}</textarea></div>
    <p class="field-hint" style="margin:14px 0 6px;">Traduction anglaise (optionnelle — le français s'affiche si vide)</p>
    <div class="field"><label>Name (EN)</label><input name="nameEn" value="${program ? escapeAttr(program.nameEn) : ""}"></div>
    <div class="field"><label>Short description (EN)</label><textarea name="shortDescriptionEn" rows="2">${program ? escapeHtml(program.shortDescriptionEn || "") : ""}</textarea></div>
    <div class="field"><label>Full description (EN)</label><textarea name="fullDescriptionEn" rows="3">${program ? escapeHtml(program.fullDescriptionEn || "") : ""}</textarea></div>
    <div class="form-row">
      <div class="field"><label>Diplôme</label><input name="diplomaLabel" value="${program ? escapeAttr(program.diplomaLabel) : "Diplôme d'Ingénieur"}"></div>
      <div class="field"><label>Frais annuels (FCFA)</label><input name="tuitionAmountXaf" type="number" value="${program ? (program.tuitionAmountXaf || "") : ""}"></div>
    </div>
    <button type="submit" class="btn btn-accent btn-block">${program ? "Enregistrer" : "Créer"}</button>
  `, async (formData) => {
    const body = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      category: formData.get("category"),
      durationLabel: formData.get("durationLabel"),
      shortDescription: formData.get("shortDescription"),
      fullDescription: formData.get("fullDescription"),
      diplomaLabel: formData.get("diplomaLabel"),
      tuitionAmountXaf: formData.get("tuitionAmountXaf") ? Number(formData.get("tuitionAmountXaf")) : null,
      nameEn: formData.get("nameEn"),
      shortDescriptionEn: formData.get("shortDescriptionEn"),
      fullDescriptionEn: formData.get("fullDescriptionEn"),
      level: "Ingénieur",
      tags: [],
      displayOrder: 0,
    };
    if (program) await VogtAPI.admin.updateProgram(program.id, body);
    else await VogtAPI.admin.createProgram(body);
    showMessage("Formation enregistrée.", "success");
    closeModal();
    await loadPrograms();
  });
}

/* ---------------- Actualités ---------------- */
let newsCache = [];

async function loadNews() {
  const el = document.getElementById("newsTable");
  try {
    newsCache = await VogtAPI.admin.listNews();
    if (newsCache.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucun article. Créez le premier.</div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <tr><th>Titre</th><th>Catégorie</th><th>Statut</th><th>Actions</th></tr>
        ${newsCache.map(n => `
          <tr>
            <td>${escapeHtml(n.title)}</td>
            <td>${escapeHtml(n.category || "—")}</td>
            <td><span class="status-badge status-${n.status}">${n.status}</span></td>
            <td class="row-actions">
              <button onclick="openNewsModal('${n.id}')">Modifier</button>
              ${n.status !== "PUBLISHED" ? `<button onclick="newsAction('${n.id}','publish')">Publier</button>` : ""}
              <button onclick="newsAction('${n.id}','archive')">Archiver</button>
            </td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les actualités. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

async function newsAction(id, action) {
  try {
    if (action === "publish") await VogtAPI.admin.publishNews(id);
    if (action === "archive") await VogtAPI.admin.archiveNews(id);
    showMessage("Article mis à jour.", "success");
    await loadNews();
  } catch (err) {
    showMessage(err.message || "Action impossible.", "error");
  }
}

function openNewsModal(id) {
  const news = id ? newsCache.find(n => n.id === id) : null;
  openModal(news ? "Modifier l'article" : "Nouvel article", `
    <div class="form-row">
      <div class="field"><label>Titre</label><input name="title" required value="${news ? escapeAttr(news.title) : ""}"></div>
      <div class="field"><label>Slug (URL)</label><input name="slug" required value="${news ? escapeAttr(news.slug) : ""}"></div>
    </div>
    <div class="form-row">
      <div class="field"><label>Catégorie</label>
        <select name="category">
          <option value="CAMPUS" ${news?.category === "CAMPUS" ? "selected" : ""}>Campus</option>
          <option value="INNOVATION" ${news?.category === "INNOVATION" ? "selected" : ""}>Innovation</option>
          <option value="RECHERCHE" ${news?.category === "RECHERCHE" ? "selected" : ""}>Recherche</option>
          <option value="ADMISSIONS" ${news?.category === "ADMISSIONS" ? "selected" : ""}>Admissions</option>
          <option value="VIE_ETUDIANTE" ${news?.category === "VIE_ETUDIANTE" ? "selected" : ""}>Vie étudiante</option>
        </select>
      </div>
      <div class="field"><label>Auteur</label><input name="author" value="${news ? escapeAttr(news.author) : "Administration Vogt"}"></div>
    </div>
    <div class="field"><label>Résumé</label><textarea name="excerpt" rows="2">${news ? escapeHtml(news.excerpt || "") : ""}</textarea></div>
    <div class="field"><label>Contenu</label><textarea name="content" rows="6">${news ? escapeHtml(news.content || "") : ""}</textarea></div>
    <p class="field-hint" style="margin:14px 0 6px;">Traduction anglaise (optionnelle)</p>
    <div class="field"><label>Title (EN)</label><input name="titleEn" value="${news ? escapeAttr(news.titleEn) : ""}"></div>
    <div class="field"><label>Excerpt (EN)</label><textarea name="excerptEn" rows="2">${news ? escapeHtml(news.excerptEn || "") : ""}</textarea></div>
    <div class="field"><label>Content (EN)</label><textarea name="contentEn" rows="4">${news ? escapeHtml(news.contentEn || "") : ""}</textarea></div>
    <button type="submit" class="btn btn-accent btn-block">${news ? "Enregistrer" : "Créer en brouillon"}</button>
  `, async (formData) => {
    const body = {
      title: formData.get("title"),
      slug: formData.get("slug"),
      category: formData.get("category"),
      author: formData.get("author"),
      excerpt: formData.get("excerpt"),
      content: formData.get("content"),
      titleEn: formData.get("titleEn"),
      excerptEn: formData.get("excerptEn"),
      contentEn: formData.get("contentEn"),
    };
    if (news) await VogtAPI.admin.updateNews(news.id, body);
    else await VogtAPI.admin.createNews(body);
    showMessage("Article enregistré.", "success");
    closeModal();
    await loadNews();
  });
}

/* ---------------- Événements ---------------- */
let eventsCache = [];

async function loadEvents() {
  const el = document.getElementById("eventsTable");
  try {
    eventsCache = await VogtAPI.admin.listEvents();
    if (eventsCache.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucun événement. Créez le premier.</div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <tr><th>Titre</th><th>Date</th><th>Lieu</th><th>Statut</th><th>Actions</th></tr>
        ${eventsCache.map(e => `
          <tr>
            <td>${escapeHtml(e.title)}</td>
            <td>${e.startsAt ? new Date(e.startsAt).toLocaleString("fr-FR") : "—"}</td>
            <td>${escapeHtml(e.location || "—")}</td>
            <td><span class="status-badge status-${e.status}">${e.status}</span></td>
            <td class="row-actions">
              <button onclick="openEventModal('${e.id}')">Modifier</button>
              ${e.status !== "PUBLISHED" ? `<button onclick="eventAction('${e.id}')">Publier</button>` : ""}
            </td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les événements. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

async function eventAction(id) {
  try {
    await VogtAPI.admin.publishEvent(id);
    showMessage("Événement publié.", "success");
    await loadEvents();
  } catch (err) {
    showMessage(err.message || "Action impossible.", "error");
  }
}

function openEventModal(id) {
  const evt = id ? eventsCache.find(e => e.id === id) : null;
  openModal(evt ? "Modifier l'événement" : "Nouvel événement", `
    <div class="field"><label>Titre</label><input name="title" required value="${evt ? escapeAttr(evt.title) : ""}"></div>
    <div class="form-row">
      <div class="field"><label>Début</label><input name="startsAt" type="datetime-local" value="${evt && evt.startsAt ? toLocalInput(evt.startsAt) : ""}"></div>
      <div class="field"><label>Fin</label><input name="endsAt" type="datetime-local" value="${evt && evt.endsAt ? toLocalInput(evt.endsAt) : ""}"></div>
    </div>
    <div class="field"><label>Lieu</label><input name="location" value="${evt ? escapeAttr(evt.location) : ""}"></div>
    <div class="field"><label>Description</label><textarea name="description" rows="3">${evt ? escapeHtml(evt.description || "") : ""}</textarea></div>
    <p class="field-hint" style="margin:14px 0 6px;">Traduction anglaise (optionnelle)</p>
    <div class="field"><label>Title (EN)</label><input name="titleEn" value="${evt ? escapeAttr(evt.titleEn) : ""}"></div>
    <div class="field"><label>Description (EN)</label><textarea name="descriptionEn" rows="2">${evt ? escapeHtml(evt.descriptionEn || "") : ""}</textarea></div>
    <button type="submit" class="btn btn-accent btn-block">${evt ? "Enregistrer" : "Créer"}</button>
  `, async (formData) => {
    const body = {
      title: formData.get("title"),
      startsAt: formData.get("startsAt") ? new Date(formData.get("startsAt")).toISOString() : null,
      endsAt: formData.get("endsAt") ? new Date(formData.get("endsAt")).toISOString() : null,
      location: formData.get("location"),
      description: formData.get("description"),
      titleEn: formData.get("titleEn"),
      descriptionEn: formData.get("descriptionEn"),
      registrationRequired: false,
    };
    if (evt) await VogtAPI.admin.updateEvent(evt.id, body);
    else await VogtAPI.admin.createEvent(body);
    showMessage("Événement enregistré.", "success");
    closeModal();
    await loadEvents();
  });
}

/* ---------------- Années académiques ---------------- */
async function loadYears() {
  const el = document.getElementById("yearsTable");
  try {
    const years = await VogtAPI.admin.listAcademicYears();
    if (years.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucune année académique. Créez la première.</div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <tr><th>Année</th><th>Statut</th><th>Actions</th></tr>
        ${years.map(y => `
          <tr>
            <td>${escapeHtml(y.label)}</td>
            <td><span class="status-badge status-${y.status === "ACTIVE" ? "ADMITTED" : "DRAFT"}">${y.status}</span></td>
            <td class="row-actions">
              ${y.status !== "ACTIVE" ? `<button onclick="activateYear('${y.id}')">Activer</button>` : ""}
            </td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les années académiques. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

async function activateYear(id) {
  try {
    await VogtAPI.admin.activateAcademicYear(id);
    showMessage("Année académique activée. L'année précédente est archivée.", "success");
    await loadYears();
  } catch (err) {
    showMessage(err.message || "Action impossible.", "error");
  }
}

function openYearModal() {
  openModal("Nouvelle année académique", `
    <div class="field"><label>Libellé (ex. 2027-2028)</label><input name="label" required placeholder="2027-2028"></div>
    <div class="form-row">
      <div class="field"><label>Début</label><input name="startDate" type="date" required></div>
      <div class="field"><label>Fin</label><input name="endDate" type="date" required></div>
    </div>
    <button type="submit" class="btn btn-accent btn-block">Créer (statut : à venir)</button>
  `, async (formData) => {
    await VogtAPI.admin.createAcademicYear({
      label: formData.get("label"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });
    showMessage("Année académique créée.", "success");
    closeModal();
    await loadYears();
  });
}

/* ---------------- Vogt Labs ---------------- */
async function loadLabs() {
  const el = document.getElementById("labsTable");
  try {
    const labs = await VogtAPI.admin.listLabs();
    if (labs.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucun laboratoire. Ajoutez le premier.</div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <tr><th>Nom</th><th>Description</th><th>Statut</th><th>Actions</th></tr>
        ${labs.map(l => `
          <tr>
            <td>${escapeHtml(l.name)}</td>
            <td>${escapeHtml(l.description || "—")}</td>
            <td><span class="status-badge status-${l.active ? "ADMITTED" : "DRAFT"}">${l.active ? "Actif" : "Inactif"}</span></td>
            <td class="row-actions"><button onclick="toggleLab('${l.id}')">Basculer</button></td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les laboratoires. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

async function toggleLab(id) {
  try {
    await VogtAPI.admin.toggleLab(id);
    await loadLabs();
  } catch (err) {
    showMessage(err.message || "Action impossible.", "error");
  }
}

function openLabModal() {
  openModal("Nouveau laboratoire", `
    <div class="field"><label>Nom</label><input name="name" required placeholder="AI Lab"></div>
    <div class="field"><label>Description</label><textarea name="description" rows="3"></textarea></div>
    <button type="submit" class="btn btn-accent btn-block">Créer</button>
  `, async (formData) => {
    await VogtAPI.admin.createLab({
      name: formData.get("name"),
      description: formData.get("description"),
      futureProject: true,
    });
    showMessage("Laboratoire créé.", "success");
    closeModal();
    await loadLabs();
  });
}

/* ---------------- Candidatures ---------------- */
const STATUS_OPTIONS = ["DRAFT","SUBMITTED","UNDER_REVIEW","DOCUMENTS_ACCEPTED","EXAM_SCHEDULED","ADMITTED","REJECTED","ENROLLED"];
let applicationsCache = [];

async function loadApplications() {
  const el = document.getElementById("applicationsTable");
  try {
    applicationsCache = await VogtAPI.admin.listApplications();
    if (applicationsCache.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucune candidature pour le moment.</div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <tr><th>N° dossier</th><th>Candidat</th><th>Formation</th><th>Statut</th><th>Actions</th></tr>
        ${applicationsCache.map(a => `
          <tr>
            <td>${escapeHtml(a.trackingNumber)}</td>
            <td>${escapeHtml(a.candidateName || "—")}<br><span class="field-hint">${escapeHtml(a.candidateEmail || "")}</span></td>
            <td>${escapeHtml(a.firstChoiceProgram || "—")}</td>
            <td><span class="status-badge status-${a.status}">${a.status}</span></td>
            <td class="row-actions"><button onclick="openApplicationModal('${a.trackingNumber}')">Changer le statut</button></td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les candidatures. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

function openApplicationModal(trackingNumber) {
  const app = applicationsCache.find(a => a.trackingNumber === trackingNumber);
  openModal(`Candidature ${trackingNumber}`, `
    <p style="margin-bottom:14px; color:var(--color-text-muted); font-size:.88rem;">${escapeHtml(app.candidateName || "")} — ${escapeHtml(app.firstChoiceProgram || "")}</p>
    <div class="field">
      <label>Nouveau statut</label>
      <select name="status">
        ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === app.status ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </div>
    <div class="field"><label>Note (interne)</label><textarea name="reviewerNote" rows="3">${escapeHtml(app.reviewerNote || "")}</textarea></div>
    <button type="submit" class="btn btn-accent btn-block">Mettre à jour</button>
  `, async (formData) => {
    await VogtAPI.admin.updateApplicationStatus(trackingNumber, {
      status: formData.get("status"),
      reviewerNote: formData.get("reviewerNote"),
    });
    showMessage("Candidature mise à jour.", "success");
    closeModal();
    await loadApplications();
  });
}

/* ---------------- Partenaires ---------------- */
async function loadPartners() {
  const el = document.getElementById("partnersTable");
  try {
    const partners = await VogtAPI.admin.listPartners();
    if (partners.length === 0) { el.innerHTML = `<div class="empty-state">Aucun partenaire.</div>`; return; }
    el.innerHTML = `
      <table>
        <tr><th>Nom</th><th>Catégorie</th></tr>
        ${partners.map(p => `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category || "—")}</td></tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les partenaires. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

function openPartnerModal() {
  openModal("Nouveau partenaire", `
    <div class="field"><label>Nom</label><input name="name" required></div>
    <div class="field"><label>Catégorie</label>
      <select name="category">
        <option value="ACADEMIQUE">Académique</option>
        <option value="ENTREPRISE">Entreprise</option>
        <option value="INSTITUTIONNEL">Institutionnel</option>
        <option value="STARTUP">Startup</option>
      </select>
    </div>
    <div class="field"><label>Logo (fichier image, optionnel)</label><input type="file" name="logoFile" accept="image/*"></div>
    <div class="field"><label>Site web</label><input name="websiteUrl" placeholder="https://..."></div>
    <button type="submit" class="btn btn-accent btn-block">Créer</button>
  `, async (formData) => {
    let logoUrl = "";
    const file = formData.get("logoFile");
    if (file && file.size > 0) {
      const uploaded = await VogtAPI.admin.uploadMedia(file, "partners");
      logoUrl = uploaded.url;
    }
    await VogtAPI.admin.createPartner({
      name: formData.get("name"), category: formData.get("category"),
      logoUrl, websiteUrl: formData.get("websiteUrl"), active: true,
    });
    showMessage("Partenaire créé.", "success");
    closeModal();
    await loadPartners();
  });
}

/* ---------------- Galerie ---------------- */
async function loadGallery() {
  const el = document.getElementById("galleryTable");
  try {
    const items = await VogtAPI.admin.listGallery();
    if (items.length === 0) { el.innerHTML = `<div class="empty-state">Aucun média.</div>`; return; }
    el.innerHTML = `
      <table>
        <tr><th>Album</th><th>Titre</th><th>Type</th><th>Actions</th></tr>
        ${items.map(g => `
          <tr>
            <td>${escapeHtml(g.album || "—")}</td>
            <td>${escapeHtml(g.title || "—")}</td>
            <td>${escapeHtml(g.mediaType || "—")}</td>
            <td class="row-actions"><button onclick="deleteGalleryItem('${g.id}')">Supprimer</button></td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger la galerie. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

async function deleteGalleryItem(id) {
  try { await VogtAPI.admin.deleteGalleryItem(id); await loadGallery(); }
  catch (err) { showMessage(err.message || "Suppression impossible.", "error"); }
}

function openGalleryModal() {
  openModal("Ajouter un média", `
    <div class="field"><label>Album</label>
      <select name="album">
        <option value="CAMPUS">Campus</option>
        <option value="LABORATOIRES">Laboratoires</option>
        <option value="ETUDIANTS">Étudiants</option>
        <option value="EVENEMENTS">Événements</option>
        <option value="PROJETS">Projets</option>
        <option value="HERO">Hero (page d'accueil)</option>
      </select>
    </div>
    <div class="field"><label>Titre</label><input name="title"></div>
    <div class="field"><label>Fichier image</label><input type="file" name="file" accept="image/*" required></div>
    <button type="submit" class="btn btn-accent btn-block">Téléverser et ajouter</button>
  `, async (formData) => {
    const file = formData.get("file");
    if (!file || file.size === 0) throw new Error("Choisissez un fichier image.");
    const { url } = await VogtAPI.admin.uploadMedia(file, "gallery");
    await VogtAPI.admin.addGalleryItem({
      album: formData.get("album"), title: formData.get("title"),
      mediaUrl: url, mediaType: "IMAGE",
    });
    showMessage("Média téléversé et ajouté.", "success");
    closeModal();
    await loadGallery();
  });
}

/* ---------------- FAQ ---------------- */
async function loadFaq() {
  const el = document.getElementById("faqTable");
  try {
    const items = await VogtAPI.admin.listFaq();
    if (items.length === 0) { el.innerHTML = `<div class="empty-state">Aucune question.</div>`; return; }
    el.innerHTML = `
      <table>
        <tr><th>Question</th><th>Catégorie</th><th>Actions</th></tr>
        ${items.map(f => `
          <tr>
            <td>${escapeHtml(f.question)}</td>
            <td>${escapeHtml(f.category || "—")}</td>
            <td class="row-actions"><button onclick="deleteFaq('${f.id}')">Supprimer</button></td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger la FAQ. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

async function deleteFaq(id) {
  try { await VogtAPI.admin.deleteFaq(id); await loadFaq(); }
  catch (err) { showMessage(err.message || "Suppression impossible.", "error"); }
}

function openFaqModal() {
  openModal("Nouvelle question FAQ", `
    <div class="field"><label>Question</label><input name="question" required></div>
    <div class="field"><label>Réponse</label><textarea name="answer" rows="4" required></textarea></div>
    <p class="field-hint" style="margin:14px 0 6px;">Traduction anglaise (optionnelle)</p>
    <div class="field"><label>Question (EN)</label><input name="questionEn"></div>
    <div class="field"><label>Answer (EN)</label><textarea name="answerEn" rows="3"></textarea></div>
    <div class="field"><label>Catégorie</label>
      <select name="category">
        <option value="ADMISSIONS">Admissions</option>
        <option value="FORMATIONS">Formations</option>
        <option value="VIE_ETUDIANTE">Vie étudiante</option>
        <option value="GENERAL">Général</option>
      </select>
    </div>
    <button type="submit" class="btn btn-accent btn-block">Ajouter</button>
  `, async (formData) => {
    await VogtAPI.admin.createFaq({
      question: formData.get("question"), answer: formData.get("answer"), category: formData.get("category"),
      questionEn: formData.get("questionEn"), answerEn: formData.get("answerEn"),
    });
    showMessage("Question ajoutée.", "success");
    closeModal();
    await loadFaq();
  });
}

/* ---------------- Projets étudiants ---------------- */
async function loadProjects() {
  const el = document.getElementById("projectsTable");
  try {
    const items = await VogtAPI.admin.listProjects();
    if (items.length === 0) { el.innerHTML = `<div class="empty-state">Aucun projet.</div>`; return; }
    el.innerHTML = `
      <table>
        <tr><th>Titre</th><th>Catégorie</th><th>Année</th><th>Actions</th></tr>
        ${items.map(p => `
          <tr>
            <td>${escapeHtml(p.title)}</td>
            <td>${escapeHtml(p.category || "—")}</td>
            <td>${escapeHtml(p.year || "—")}</td>
            <td class="row-actions"><button onclick="deleteProject('${p.id}')">Supprimer</button></td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les projets. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

async function deleteProject(id) {
  try { await VogtAPI.admin.deleteProject(id); await loadProjects(); }
  catch (err) { showMessage(err.message || "Suppression impossible.", "error"); }
}

function openProjectModal() {
  openModal("Nouveau projet étudiant", `
    <div class="field"><label>Titre</label><input name="title" required></div>
    <div class="form-row">
      <div class="field"><label>Catégorie</label>
        <select name="category">
          <option value="IA">IA</option><option value="ROBOTIQUE">Robotique</option>
          <option value="SOFTWARE">Software</option><option value="IOT">IoT</option><option value="DATA">Data</option>
        </select>
      </div>
      <div class="field"><label>Année</label><input name="year" placeholder="2026"></div>
    </div>
    <div class="field"><label>Équipe</label><input name="teamNames" placeholder="Noms des étudiants"></div>
    <div class="field"><label>Description</label><textarea name="description" rows="3"></textarea></div>
    <button type="submit" class="btn btn-accent btn-block">Créer</button>
  `, async (formData) => {
    await VogtAPI.admin.createProject({
      title: formData.get("title"), category: formData.get("category"),
      year: formData.get("year"), teamNames: formData.get("teamNames"), description: formData.get("description"),
    });
    showMessage("Projet ajouté.", "success");
    closeModal();
    await loadProjects();
  });
}

/* ---------------- Paiements ---------------- */
async function loadPayments() {
  const el = document.getElementById("paymentsTable");
  try {
    const payments = await VogtAPI.admin.listPayments();
    if (payments.length === 0) { el.innerHTML = `<div class="empty-state">Aucune facture.</div>`; return; }
    el.innerHTML = `
      <table>
        <tr><th>Libellé</th><th>Montant (FCFA)</th><th>Statut</th><th>Actions</th></tr>
        ${payments.map(p => `
          <tr>
            <td>${escapeHtml(p.label || "")}</td>
            <td>${Number(p.amountXaf || 0).toLocaleString("fr-FR")}</td>
            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
            <td class="row-actions">${p.status !== "PAID" ? `<button onclick="markPaid('${p.id}')">Marquer payé</button>` : ""}</td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les paiements. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

async function markPaid(id) {
  try { await VogtAPI.admin.markPaymentPaid(id); showMessage("Paiement marqué payé.", "success"); await loadPayments(); }
  catch (err) { showMessage(err.message || "Action impossible.", "error"); }
}

async function openInvoiceModal() {
  let students = [];
  try { students = await VogtAPI.admin.listStudents(); } catch (e) { /* ignore */ }
  openModal("Nouvelle facture", `
    <div class="field"><label>Étudiant</label>
      <select name="studentId" required>
        ${students.map(s => `<option value="${s.id}">${escapeHtml(s.matricule || s.id)}</option>`).join("")}
      </select>
    </div>
    <div class="field"><label>Libellé</label><input name="label" required placeholder="Frais de scolarité - Tranche 1"></div>
    <div class="field"><label>Montant (FCFA)</label><input name="amountXaf" type="number" required></div>
    <button type="submit" class="btn btn-accent btn-block">Créer la facture</button>
  `, async (formData) => {
    await VogtAPI.admin.createInvoice(formData.get("studentId"), Number(formData.get("amountXaf")), formData.get("label"));
    showMessage("Facture créée.", "success");
    closeModal();
    await loadPayments();
  });
}

/* ---------------- Journal d'audit ---------------- */
async function loadAuditLogs() {
  const el = document.getElementById("auditLogsTable");
  try {
    const logs = await VogtAPI.admin.listAuditLogs();
    if (logs.length === 0) { el.innerHTML = `<div class="empty-state">Aucune action enregistrée.</div>`; return; }
    el.innerHTML = `
      <table>
        <tr><th>Date</th><th>Auteur</th><th>Action</th><th>Détail</th></tr>
        ${logs.map(l => `
          <tr>
            <td>${new Date(l.createdAt).toLocaleString("fr-FR")}</td>
            <td>${escapeHtml(l.actorEmail)}<br><span class="field-hint">${escapeHtml(l.actorRole || "")}</span></td>
            <td>${escapeHtml(l.action)}</td>
            <td>${escapeHtml(l.detail || "")}</td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Réservé aux SUPER_ADMIN, ou aucune action enregistrée.</div>`;
  }
}

/* ---------------- Securite / 2FA ---------------- */
async function setup2fa() {
  try {
    const { secret, otpAuthUri } = await VogtAPI.admin.setup2fa();
    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(otpAuthUri);
    document.getElementById("securityContent").innerHTML = `
      <p style="margin-bottom:12px; font-size:.88rem;">1. Scannez ce QR code avec votre application d'authentification :</p>
      <img src="${qrUrl}" alt="QR code 2FA" style="border:1px solid var(--color-border); border-radius:8px; margin-bottom:16px;">
      <p class="field-hint" style="margin-bottom:16px;">Secret manuel si besoin : <code>${secret}</code></p>
      <div class="field"><label>2. Entrez le code affiché par l'application pour confirmer</label><input type="text" id="confirm2faCode" maxlength="6" placeholder="123456"></div>
      <button class="btn btn-accent" id="confirm2faBtn">Confirmer et activer</button>
    `;
    document.getElementById("confirm2faBtn").addEventListener("click", async () => {
      try {
        await VogtAPI.admin.enable2fa(document.getElementById("confirm2faCode").value);
        showMessage("2FA activé avec succès. Vous devrez saisir un code à chaque connexion.", "success");
        document.getElementById("securityContent").innerHTML = `<p>✅ 2FA activé sur ce compte.</p><button class="btn btn-outline" id="disable2faBtn">Désactiver le 2FA</button>`;
        document.getElementById("disable2faBtn").addEventListener("click", async () => {
          await VogtAPI.admin.disable2fa();
          showMessage("2FA désactivé.", "success");
          document.getElementById("securityContent").innerHTML = `<button class="btn btn-accent" id="setup2faBtn">Activer le 2FA</button>`;
          document.getElementById("setup2faBtn").addEventListener("click", () => setup2fa());
        });
      } catch (err) {
        showMessage(err.message || "Code invalide.", "error");
      }
    });
  } catch (err) {
    showMessage(err.message || "Impossible de démarrer la configuration 2FA.", "error");
  }
}

/* ---------------- Comptes : enseignants ---------------- */
async function loadTeachers() {
  const el = document.getElementById("teachersTable");
  try {
    const teachers = await VogtAPI.admin.listTeachers();
    if (teachers.length === 0) { el.innerHTML = `<div class="empty-state">Aucun enseignant.</div>`; return; }
    el.innerHTML = `
      <table>
        <tr><th>Nom</th><th>Email</th><th>Département</th><th>Statut</th><th>Actions</th></tr>
        ${teachers.map(t => `
          <tr>
            <td>${escapeHtml((t.user?.firstName || "") + " " + (t.user?.lastName || ""))}</td>
            <td>${escapeHtml(t.user?.email || "")}</td>
            <td>${escapeHtml(t.department || "—")}</td>
            <td><span class="status-badge status-${t.user?.active ? "ADMITTED" : "REJECTED"}">${t.user?.active ? "Actif" : "Désactivé"}</span></td>
            <td class="row-actions">
              ${t.user?.active
                ? `<button onclick="toggleAccount('${t.user.id}', false, loadTeachers)">Désactiver</button>`
                : `<button onclick="toggleAccount('${t.user.id}', true, loadTeachers)">Réactiver</button>`}
            </td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les enseignants. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

function openTeacherModal() {
  openModal("Nouveau compte enseignant", `
    <div class="form-row">
      <div class="field"><label>Prénom</label><input name="firstName" required></div>
      <div class="field"><label>Nom</label><input name="lastName" required></div>
    </div>
    <div class="field"><label>Email</label><input name="email" type="email" required></div>
    <div class="field"><label>Téléphone</label><input name="phone"></div>
    <div class="field"><label>Département</label><input name="department" placeholder="Informatique"></div>
    <div class="field"><label>Titre</label><input name="title" placeholder="Enseignant-chercheur"></div>
    <div class="field"><label>Mot de passe initial</label><input name="initialPassword" type="text" required placeholder="À communiquer à l'enseignant"></div>
    <p class="field-hint" style="margin-bottom:14px;">Un email avec un lien pour définir son propre mot de passe lui sera aussi envoyé.</p>
    <button type="submit" class="btn btn-accent btn-block">Créer le compte</button>
  `, async (formData) => {
    await VogtAPI.admin.createTeacher({
      firstName: formData.get("firstName"), lastName: formData.get("lastName"),
      email: formData.get("email"), phone: formData.get("phone"),
      initialPassword: formData.get("initialPassword"),
      department: formData.get("department"), title: formData.get("title"), specialties: [],
    });
    showMessage("Compte enseignant créé.", "success");
    closeModal();
    await loadTeachers();
  });
}

/* ---------------- Comptes : étudiants ---------------- */
async function loadStudentsAccounts() {
  const el = document.getElementById("studentsTable");
  try {
    const students = await VogtAPI.admin.listStudents();
    if (students.length === 0) { el.innerHTML = `<div class="empty-state">Aucun étudiant.</div>`; return; }
    el.innerHTML = `
      <table>
        <tr><th>Matricule</th><th>Nom</th><th>Email</th><th>Statut</th><th>Actions</th></tr>
        ${students.map(s => `
          <tr>
            <td>${escapeHtml(s.matricule || "—")}</td>
            <td>${escapeHtml((s.user?.firstName || "") + " " + (s.user?.lastName || ""))}</td>
            <td>${escapeHtml(s.user?.email || "")}</td>
            <td><span class="status-badge status-${s.user?.active ? "ADMITTED" : "REJECTED"}">${s.user?.active ? "Actif" : "Désactivé"}</span></td>
            <td class="row-actions">
              ${s.user?.active
                ? `<button onclick="toggleAccount('${s.user.id}', false, loadStudentsAccounts)">Désactiver</button>`
                : `<button onclick="toggleAccount('${s.user.id}', true, loadStudentsAccounts)">Réactiver</button>`}
            </td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les étudiants. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

function openStudentModal() {
  openModal("Nouveau compte étudiant", `
    <div class="form-row">
      <div class="field"><label>Prénom</label><input name="firstName" required></div>
      <div class="field"><label>Nom</label><input name="lastName" required></div>
    </div>
    <div class="field"><label>Email</label><input name="email" type="email" required></div>
    <div class="field"><label>Téléphone</label><input name="phone"></div>
    <div class="form-row">
      <div class="field"><label>Matricule</label><input name="matricule" required></div>
      <div class="field"><label>Année de cursus</label><input name="yearOfStudy" type="number" min="1" max="5" value="1"></div>
    </div>
    <div class="field"><label>Formation</label>
      <select name="programId">${(programsCache || []).map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}</select>
    </div>
    <div class="field"><label>Mot de passe initial</label><input name="initialPassword" type="text" required></div>
    <button type="submit" class="btn btn-accent btn-block">Créer le compte</button>
  `, async (formData) => {
    await VogtAPI.admin.createStudent({
      firstName: formData.get("firstName"), lastName: formData.get("lastName"),
      email: formData.get("email"), phone: formData.get("phone"),
      initialPassword: formData.get("initialPassword"),
      matricule: formData.get("matricule"), yearOfStudy: Number(formData.get("yearOfStudy") || 1),
      programId: formData.get("programId") || null,
    });
    showMessage("Compte étudiant créé.", "success");
    closeModal();
    await loadStudentsAccounts();
  });
}

/* ---------------- Comptes : administration (hiérarchie discrète) ---------------- */
async function loadAdminAccounts() {
  const el = document.getElementById("adminsTable");
  try {
    const admins = await VogtAPI.admin.listAdmins();
    if (admins.length === 0) { el.innerHTML = `<div class="empty-state">Aucun compte admin visible.</div>`; return; }
    el.innerHTML = `
      <table>
        <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr>
        ${admins.map(a => `
          <tr>
            <td>${escapeHtml(a.firstName + " " + a.lastName)}</td>
            <td>${escapeHtml(a.email)}</td>
            <td>${escapeHtml(a.role)}</td>
            <td><span class="status-badge status-${a.active ? "ADMITTED" : "REJECTED"}">${a.active ? "Actif" : "Désactivé"}</span></td>
            <td class="row-actions">
              ${a.active
                ? `<button onclick="toggleAccount('${a.id}', false, loadAdminAccounts)">Désactiver</button>`
                : `<button onclick="toggleAccount('${a.id}', true, loadAdminAccounts)">Réactiver</button>`}
            </td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger les comptes admin. ${err.message ? "(" + err.message + ")" : ""}</div>`;
  }
}

function openAdminAccountModal() {
  const myRole = VogtAPI.getRole();
  const roleOptions = myRole === "SUPER_ADMIN"
    ? `<option value="ADMIN">Administrateur (pleins pouvoirs)</option><option value="ADMISSIONS_OFFICER">Sous-admin — Admissions</option><option value="ACADEMIC_ADMIN">Sous-admin — Académique</option><option value="COMMUNICATION_ADMIN">Sous-admin — Communication</option>`
    : `<option value="ADMISSIONS_OFFICER">Sous-admin — Admissions</option><option value="ACADEMIC_ADMIN">Sous-admin — Académique</option><option value="COMMUNICATION_ADMIN">Sous-admin — Communication</option>`;

  openModal("Nouveau compte administration", `
    <div class="form-row">
      <div class="field"><label>Prénom</label><input name="firstName" required></div>
      <div class="field"><label>Nom</label><input name="lastName" required></div>
    </div>
    <div class="field"><label>Email</label><input name="email" type="email" required></div>
    <div class="field"><label>Rôle</label><select name="role">${roleOptions}</select></div>
    <div class="field"><label>Mot de passe initial</label><input name="initialPassword" type="text" required></div>
    <button type="submit" class="btn btn-accent btn-block">Créer le compte</button>
  `, async (formData) => {
    await VogtAPI.admin.createAdmin({
      firstName: formData.get("firstName"), lastName: formData.get("lastName"),
      email: formData.get("email"), initialPassword: formData.get("initialPassword"),
      role: formData.get("role"),
    });
    showMessage("Compte administration créé.", "success");
    closeModal();
    await loadAdminAccounts();
  });
}

/* ---------------- Activation / désactivation commune ---------------- */
async function toggleAccount(userId, activate, reloadFn) {
  try {
    if (activate) await VogtAPI.admin.activateAccount(userId);
    else await VogtAPI.admin.deactivateAccount(userId);
    showMessage(activate ? "Compte réactivé." : "Compte désactivé.", "success");
    await reloadFn();
  } catch (err) {
    showMessage(err.message || "Action impossible.", "error");
  }
}

/* ---------------- Modale générique ---------------- */
function openModal(title, formHtml, onSubmit) {
  document.getElementById("modalTitle").textContent = title;
  const form = document.getElementById("modalForm");
  form.innerHTML = formHtml;
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(new FormData(form));
    } catch (err) {
      showMessage(err.message || "Une erreur est survenue.", "error");
    }
  };
  document.getElementById("modalBackdrop").classList.add("open");
}
function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
}

/* ---------------- Utilitaires ---------------- */
function showMessage(text, type) {
  document.getElementById("messageBox").innerHTML = `<div class="alert alert-${type}">${text}</div>`;
  setTimeout(() => { document.getElementById("messageBox").innerHTML = ""; }, 4000);
}
function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str ?? ""; return d.innerHTML; }
function escapeAttr(str) { return (str ?? "").replace(/"/g, "&quot;"); }
function toLocalInput(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
