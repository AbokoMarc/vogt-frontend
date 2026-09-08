document.addEventListener("DOMContentLoaded", async () => {
  if (!VogtAPI.isAuthenticated() || VogtAPI.getRole() !== "STUDENT") {
    document.getElementById("gate").style.display = "block";
    return;
  }

  document.getElementById("dashboard").style.display = "grid";
  document.getElementById("logoutBtn").style.display = "inline-flex";
  document.getElementById("logoutBtn").addEventListener("click", () => {
    VogtAPI.logout();
    window.location.href = "index.html";
  });

  document.querySelectorAll(".side-nav a").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".side-nav a").forEach(l => l.classList.remove("active"));
      document.querySelectorAll(".dash-panel").forEach(p => p.classList.remove("active"));
      link.classList.add("active");
      document.getElementById("panel-" + link.dataset.panel).classList.add("active");
    });
  });

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

  await loadProfile();
  await loadSchedule();
  await loadGrades();
  await loadPayments();
});

async function loadProfile() {
  try {
    const profile = await VogtAPI.getMyProfile();
    document.getElementById("greetingText").textContent = `Bonjour ${profile.firstName || ""} 👋`;
    document.getElementById("panel-profile").innerHTML = `
      <table>
        <tr><th>Matricule</th><td>${escapeHtml(profile.matricule || "—")}</td></tr>
        <tr><th>Nom complet</th><td>${escapeHtml((profile.firstName || "") + " " + (profile.lastName || ""))}</td></tr>
        <tr><th>Formation</th><td>${escapeHtml(profile.programName || "—")}</td></tr>
        <tr><th>Spécialité</th><td>${escapeHtml(profile.specializationName || "—")}</td></tr>
        <tr><th>Niveau</th><td>Année ${profile.yearOfStudy ?? "—"}</td></tr>
      </table>`;
  } catch (err) {
    document.getElementById("panel-profile").innerHTML = `<div class="empty-state">Profil indisponible pour le moment.</div>`;
  }
}

async function loadSchedule() {
  const el = document.getElementById("scheduleContent");
  try {
    const slots = await VogtAPI.getMySchedule();
    if (!slots || slots.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucun créneau publié pour le moment.</div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <tr><th>Jour</th><th>Horaire</th><th>Matière</th><th>Enseignant</th><th>Salle</th></tr>
        ${slots.map(s => `
          <tr>
            <td>${escapeHtml(s.dayOfWeek || "")}</td>
            <td>${escapeHtml(s.startTime || "")} – ${escapeHtml(s.endTime || "")}</td>
            <td>${escapeHtml(s.courseName || "")}</td>
            <td>${escapeHtml(s.teacherName || "")}</td>
            <td>${escapeHtml(s.room || "")}</td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Emploi du temps indisponible pour le moment.</div>`;
  }
}

async function loadGrades() {
  const el = document.getElementById("gradesContent");
  try {
    const grades = await VogtAPI.getMyGrades();
    if (!grades || grades.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucune note publiée pour le moment.</div>`;
      return;
    }
    const average = (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2);
    el.innerHTML = `
      <table>
        <tr><th>Matière</th><th>Semestre</th><th>Note / 20</th></tr>
        ${grades.map(g => `
          <tr>
            <td>${escapeHtml(g.courseName || "")}</td>
            <td>${escapeHtml(g.semester || "")}</td>
            <td>${g.score}</td>
          </tr>`).join("")}
      </table>
      <p style="margin-top:16px; font-weight:600; color:var(--color-primary);">Moyenne générale : ${average} / 20</p>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Notes indisponibles pour le moment.</div>`;
  }
}

async function loadPayments() {
  const el = document.getElementById("paymentsContent");
  try {
    const payments = await VogtAPI.getMyPayments();
    if (!payments || payments.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucune facture pour le moment.</div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <tr><th>Libellé</th><th>Montant (FCFA)</th><th>Statut</th></tr>
        ${payments.map(p => `
          <tr>
            <td>${escapeHtml(p.label || "")}</td>
            <td>${Number(p.amountXaf || 0).toLocaleString("fr-FR")}</td>
            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Informations de scolarité indisponibles pour le moment.</div>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
