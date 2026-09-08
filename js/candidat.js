const STEPS = [
  { key: "DRAFT", label: "Brouillon" },
  { key: "SUBMITTED", label: "Soumis" },
  { key: "UNDER_REVIEW", label: "Vérification" },
  { key: "DOCUMENTS_ACCEPTED", label: "Documents OK" },
  { key: "EXAM_SCHEDULED", label: "Concours" },
  { key: "ADMITTED", label: "Admis" },
  { key: "ENROLLED", label: "Inscrit" },
];

document.addEventListener("DOMContentLoaded", async () => {
  if (!VogtAPI.isAuthenticated() || VogtAPI.getRole() !== "CANDIDATE") {
    document.getElementById("gate").style.display = "block";
    return;
  }

  document.getElementById("portal").style.display = "block";
  document.getElementById("logoutBtn").style.display = "inline-flex";
  document.getElementById("logoutBtn").addEventListener("click", () => {
    VogtAPI.logout();
    window.location.href = "index.html";
  });

  document.getElementById("createAppBtn").addEventListener("click", createApplication);

  await loadPrograms();
  await refreshApplicationState();
});

async function loadPrograms() {
  try {
    const programs = await VogtAPI.getPrograms();
    const first = document.getElementById("firstChoice");
    const second = document.getElementById("secondChoice");
    first.innerHTML = programs.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
    programs.forEach(p => {
      second.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)}</option>`;
    });
  } catch (err) {
    showMessage("Impossible de charger la liste des formations.", "error");
  }
}

async function refreshApplicationState() {
  try {
    const application = await VogtAPI.getMyApplication();
    renderTracker(application);
  } catch (err) {
    // Aucune candidature existante pour ce candidat -> afficher le formulaire de creation.
    document.getElementById("noApplication").style.display = "block";
    document.getElementById("applicationTracker").style.display = "none";
  }
}

async function createApplication() {
  clearMessage();
  const firstChoiceProgramId = document.getElementById("firstChoice").value;
  const secondChoiceProgramId = document.getElementById("secondChoice").value || null;

  if (!firstChoiceProgramId) {
    showMessage("Veuillez choisir une formation.", "error");
    return;
  }

  try {
    const application = await VogtAPI.createApplication({ firstChoiceProgramId, secondChoiceProgramId });
    document.getElementById("noApplication").style.display = "none";
    renderTracker(application);
  } catch (err) {
    showMessage(err.message || "Impossible de créer la candidature.", "error");
  }
}

function renderTracker(application) {
  document.getElementById("applicationTracker").style.display = "block";
  document.getElementById("trackingNumber").textContent = application.trackingNumber;
  document.getElementById("programName").textContent = application.firstChoiceProgram || "Formation";
  const badge = document.getElementById("statusBadge");
  badge.textContent = application.status;
  badge.className = "status-badge status-" + application.status;

  const activeIndex = STEPS.findIndex(s => s.key === application.status);
  document.getElementById("trackerSteps").innerHTML = STEPS.map((s, i) => `
    <div class="tstep ${i <= activeIndex ? "done" : ""}">
      <div class="dot"></div>
      <span>${s.label}</span>
    </div>`).join("");

  const submitZone = document.getElementById("submitZone");
  if (application.status === "DRAFT") {
    submitZone.innerHTML = `<button class="btn btn-accent" id="submitBtn">Soumettre mon dossier</button>`;
    document.getElementById("submitBtn").addEventListener("click", async () => {
      try {
        const updated = await VogtAPI.submitApplication(application.trackingNumber);
        showMessage("Dossier soumis avec succès.", "success");
        renderTracker(updated);
      } catch (err) {
        showMessage(err.message || "Impossible de soumettre le dossier.", "error");
      }
    });
  } else {
    submitZone.innerHTML = "";
  }

  document.querySelectorAll(".doc-upload").forEach(input => {
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await VogtAPI.uploadApplicationDocument(application.trackingNumber, input.dataset.docType, file);
        showMessage("Document téléversé avec succès.", "success");
      } catch (err) {
        showMessage(err.message || "Échec du téléversement.", "error");
      }
    };
  });
}

function showMessage(text, type) {
  document.getElementById("messageBox").innerHTML = `<div class="alert alert-${type}">${text}</div>`;
}
function clearMessage() {
  document.getElementById("messageBox").innerHTML = "";
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
