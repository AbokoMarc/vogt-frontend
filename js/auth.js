document.addEventListener("DOMContentLoaded", () => {
  if (VogtAPI.isAuthenticated()) {
    redirectByRole();
    return;
  }

  document.querySelectorAll(".tab-btn").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab + "Form").classList.add("active");
      clearMessage();
    });
  });

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    try {
      const data = await VogtAPI.login(email, password);
      if (data.role === "STUDENT" || data.role === "TEACHER") {
        VogtAPI.logout();
        showMessage(`Ce compte est un compte ${data.role === "TEACHER" ? "enseignant" : "étudiant"}. Utilisez la <a href="staff-login.html" style="color:inherit; text-decoration:underline;">connexion Étudiant / Enseignant</a>.`, "error");
        return;
      }
      redirectByRole();
    } catch (err) {
      showMessage(err.message || "Identifiants invalides.", "error");
    }
  });

  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();
    const payload = {
      firstName: document.getElementById("regFirstName").value,
      lastName: document.getElementById("regLastName").value,
      email: document.getElementById("regEmail").value,
      phone: document.getElementById("regPhone").value,
      password: document.getElementById("regPassword").value,
      dateOfBirth: document.getElementById("regDob").value || null,
      bacSeries: document.getElementById("regBac").value || null,
    };
    try {
      await VogtAPI.registerCandidate(payload);
      showMessage("Compte créé avec succès. Connectez-vous pour continuer.", "success");
      document.querySelector('.tab-btn[data-tab="login"]').click();
      document.getElementById("loginEmail").value = payload.email;
    } catch (err) {
      showMessage(err.message || "Impossible de créer le compte.", "error");
    }
  });
});

function redirectByRole() {
  const role = VogtAPI.getRole();
  if (role === "STUDENT") window.location.href = "etudiant.html";
  else if (role === "TEACHER") window.location.href = "enseignant.html";
  else if (role === "CANDIDATE") window.location.href = "candidat.html";
  else window.location.href = "index.html";
}

function showMessage(text, type) {
  document.getElementById("formMessage").innerHTML =
    `<div class="alert alert-${type}">${text}</div>`;
}
function clearMessage() {
  document.getElementById("formMessage").innerHTML = "";
}
