document.addEventListener("DOMContentLoaded", async () => {
  if (!VogtAPI.isAuthenticated() || VogtAPI.getRole() !== "TEACHER") {
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

  document.getElementById("gradeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await VogtAPI.enterGrade({
        studentId: document.getElementById("gradeStudentId").value,
        courseId: document.getElementById("gradeCourseId").value,
        semester: document.getElementById("gradeSemester").value,
        score: Number(document.getElementById("gradeScore").value),
      });
      showMessage("Note enregistrée.", "success");
      e.target.reset();
    } catch (err) {
      showMessage(err.message || "Impossible d'enregistrer la note.", "error");
    }
  });

  document.getElementById("attendanceForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await VogtAPI.recordAttendance({
        student: { id: document.getElementById("attStudentId").value },
        course: { id: document.getElementById("attCourseId").value },
        date: document.getElementById("attDate").value,
        present: document.getElementById("attPresent").value === "true",
      });
      showMessage("Présence enregistrée.", "success");
      e.target.reset();
    } catch (err) {
      showMessage(err.message || "Impossible d'enregistrer la présence.", "error");
    }
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

  await loadCourses();
});

async function loadCourses() {
  const el = document.getElementById("coursesContent");
  try {
    const courses = await VogtAPI.getMyCourses();
    if (!courses || courses.length === 0) {
      el.innerHTML = `<div class="empty-state">Aucun créneau assigné pour le moment.</div>`;
      return;
    }
    el.innerHTML = `
      <table>
        <tr><th>Jour</th><th>Horaire</th><th>Salle</th></tr>
        ${courses.map(c => `
          <tr>
            <td>${escapeHtml(c.dayOfWeek || "")}</td>
            <td>${escapeHtml(c.startTime || "")} – ${escapeHtml(c.endTime || "")}</td>
            <td>${escapeHtml(c.room || "")}</td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state">Impossible de charger vos cours.</div>`;
  }
}

function showMessage(text, type) {
  document.getElementById("messageBox").innerHTML = `<div class="alert alert-${type}">${text}</div>`;
  setTimeout(() => { document.getElementById("messageBox").innerHTML = ""; }, 4000);
}
function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str ?? ""; return d.innerHTML; }
