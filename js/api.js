/**
 * VOGT HIGH TECH — Digital Campus
 * Client API vanilla JS partagé par toutes les pages du site.
 * Aucune donnée institutionnelle n'est codee en dur ici : tout vient de l'API.
 */
const VogtAPI = (() => {

  // URL corrigée avec le sous-domaine exact de votre application sur Render
  const BASE_URL = "https://onrender.com";

  const TOKEN_KEY = "vogt_access_token";
  const REFRESH_KEY = "vogt_refresh_token";
  const ROLE_KEY = "vogt_role";
  const EMAIL_KEY = "vogt_email";

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getRole() { return localStorage.getItem(ROLE_KEY); }
  function getEmail() { return localStorage.getItem(EMAIL_KEY); }
  function isAuthenticated() { return !!getToken(); }

  function saveSession(data) {
    const tokenToSave = data.accessToken || data.token;
    const refreshToSave = data.refreshToken || data.token;

    localStorage.setItem(TOKEN_KEY, tokenToSave);
    localStorage.setItem(REFRESH_KEY, refreshToSave);
    localStorage.setItem(ROLE_KEY, data.role);
    localStorage.setItem(EMAIL_KEY, data.email);
  }

  function clearSession() {
    [TOKEN_KEY, REFRESH_KEY, ROLE_KEY, EMAIL_KEY].forEach(k => localStorage.removeItem(k));
  }

  async function request(path, { method = "GET", body, auth = false, isForm = false } = {}) {
    const headers = {};
    if (!isForm) headers["Content-Type"] = "application/json";
    if (auth) {
      const token = getToken();
      if (token) headers["Authorization"] = "Bearer " + token;
    }

    const res = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined
    });

    let payload = null;
    try { payload = await res.json(); } catch (e) { /* reponse vide */ }

    if (res.status === 401) {
      clearSession();
      window.dispatchEvent(new CustomEvent("vogt:session-expired"));
      window.location.href = "/admin-login.html";
      throw new Error("Session expirée ou invalide. Merci de vous reconnecter.");
    }

    if (!res.ok || (payload && payload.success === false)) {
      const message = (payload && payload.message) || `Erreur ${res.status}`;
      throw new Error(message);
    }
    return payload ? payload.data : null;
  }

  return {
    // --- Public ---
    getPrograms: (category) => {
      const params = new URLSearchParams({ lang: (window.VogtI18n ? VogtI18n.getLang() : "fr") });
      if (category) params.set("category", category);
      return request(`/public/programs?${params.toString()}`);
    },
    getProgramBySlug: (slug) => request(`/public/programs/${encodeURIComponent(slug)}?lang=${(window.VogtI18n ? VogtI18n.getLang() : "fr")}`),
    getNews: (page = 0, size = 6, category) => {
      const params = new URLSearchParams({ page, size, lang: (window.VogtI18n ? VogtI18n.getLang() : "fr") });
      if (category) params.set("category", category);
      return request(`/public/news?${params.toString()}`);
    },
    getNewsBySlug: (slug) => request(`/public/news/${encodeURIComponent(slug)}?lang=${(window.VogtI18n ? VogtI18n.getLang() : "fr")}`),
    getUpcomingEvents: () => request(`/public/events/upcoming?lang=${(window.VogtI18n ? VogtI18n.getLang() : "fr")}`),
    getPartners: () => request("/public/partners"),
    getLabs: () => request("/public/labs"),
    getStudentProjects: () => request("/public/projects"),
    getGallery: (album) => request(`/public/gallery${album ? "?album=" + encodeURIComponent(album) : ""}`),
    getFaq: (category) => {
      const params = new URLSearchParams({ lang: (window.VogtI18n ? VogtI18n.getLang() : "fr") });
      if (category) params.set("category", category);
      return request(`/public/faq?${params.toString()}`);
    },
    getAlumniSuccessStories: () => request("/public/alumni/success-stories"),
    search: (q) => request(`/public/search?q=${encodeURIComponent(q)}`),

    // --- Auth ---
    registerCandidate: (data) => request("/auth/register/candidate", { method: "POST", body: data }),
    login: async (email, password, code) => {
      const data = await request("/auth/login", { method: "POST", body: { email, password, code } });
      saveSession(data);
      return data;
    },
    logout: clearSession,
    isAuthenticated,
    getRole,
    getEmail,

    forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
    resetPassword: (email, token, newPassword) => request("/auth/reset-password", { method: "POST", body: { email, token, newPassword } }),
    changePassword: (currentPassword, newPassword) => request("/auth/change-password", { method: "POST", body: { currentPassword, newPassword }, auth: true }),

    // --- Portail candidat ---
    createApplication: (body) => request("/candidates/applications", { method: "POST", body, auth: true }),
    getMyApplication: () => request("/candidates/applications/me", { auth: true }),
    submitApplication: (trackingNumber) => request(`/candidates/applications/${trackingNumber}/submit`, { method: "POST", auth: true }),
    trackApplication: (trackingNumber) => request(`/candidates/applications/${trackingNumber}`, { auth: true }),
    uploadApplicationDocument: (trackingNumber, documentType, file) => {
      const form = new FormData();
      form.append("documentType", documentType);
      form.append("file", file);
      return request(`/candidates/applications/${trackingNumber}/documents?documentType=${encodeURIComponent(documentType)}`, {
        method: "POST", body: form, auth: true, isForm: true
      });
    },

    // --- Portail etudiant ---
    getMyProfile: () => request("/students/me/profile", { auth: true }),
    getMySchedule: () => request("/students/me/schedule", { auth: true }),
    getMyGrades: (semester) => request(`/students/me/grades${semester ? "?semester=" + semester : ""}`, { auth: true }),
    getMyPayments: () => request("/students/me/payments", { auth: true }),
    getMyAttendance: () => request("/students/me/attendance", { auth: true }),

    // --- Portail enseignant ---
    getMyTeacherProfile: () => request("/teachers/me/profile", { auth: true }),
    getMyCourses: () => request("/teachers/me/courses", { auth: true }),
    getMyTeachingStudents: () => request("/teachers/me/students", { auth: true }),
    getMyCourseOptions: () => request("/teachers/me/course-options", { auth: true }),
    enterGrade: (body) => request("/teachers/me/grades", { method: "POST", body, auth: true }),
    recordAttendance: (body) => request("/teachers/me/attendance", { method: "POST", body, auth: true }),

    // --- VOGT ADMIN ---
    admin: {
      overview: () => request("/admin/dashboard/overview", { auth: true }),

      listPrograms: () => request("/admin/programs", { auth: true }),
      createProgram: (body) => request("/admin/programs", { method: "POST", body, auth: true }),
      updateProgram: (id, body) => request(`/admin/programs/${id}`, { method: "PATCH", body, auth: true }),
      publishProgram: (id) => request(`/admin/programs/${id}/publish`, { method: "POST", auth: true }),
      unpublishProgram: (id) => request(`/admin/programs/${id}/unpublish`, { method: "POST", auth: true }),
      archiveProgram: (id) => request(`/admin/programs/${id}/archive`, { method: "POST", auth: true }),

      listNews: () => request("/admin/news", { auth: true }),
      createNews: (body) => request("/admin/news", { method: "POST", body, auth: true }),
      updateNews: (id, body) => request(`/admin/news/${id}`, { method: "PATCH", body, auth: true }),
      publishNews: (id) => request(`/admin/news/${id}/publish`, { method: "POST", auth: true }),
      archiveNews: (id) => request(`/admin/news/${id}/archive`, { method: "POST", auth: true }),

      listEvents: () => request("/admin/events", { auth: true }),
      createEvent: (body) => request("/admin/events", { method: "POST", body, auth: true }),
      updateEvent: (id, body) => request(`/admin/events/${id}`, { method: "PATCH", body, auth: true }),
      publishEvent: (id) => request(`/admin/events/${id}/publish`, { method: "POST", auth: true }),

      listAcademicYears: () => request("/admin/academic-years", { auth: true }),
      createAcademicYear: (body) => request("/admin/academic-years", { method: "POST", body, auth: true })
    }
  };
})();
