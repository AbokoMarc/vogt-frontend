/**
 * i18n : traduit les textes fixes de l'interface (data-i18n) et fournit la
 * langue active pour que api.js l'ajoute aux appels publics (?lang=fr|en).
 * Formations, actualités, événements et FAQ sont traduits côté backend quand
 * une version anglaise a été renseignée dans le CMS (repli sur le français
 * sinon). Les portails candidat/étudiant/enseignant/admin restent en
 * français pour l'instant (usage interne, non couvert par cette itération).
 */
const VogtI18n = (() => {
  const LANG_KEY = "vogt_lang";

  const dict = {
    fr: {
      nav_formations: "Formations", nav_admissions: "Admissions", nav_actualites: "Actualités",
      nav_evenements: "Événements", nav_espace_etudiant: "Espace étudiant", nav_accueil: "Accueil",
      btn_connexion: "Connexion", btn_candidater: "Candidater",
      hero_title: "Former les ingénieurs qui construiront demain.",
      hero_lede: "Une formation supérieure orientée ingénierie, technologie et entrepreneuriat — génie logiciel, intelligence artificielle, data science, électronique et robotique.",
      hero_cta1: "Candidater maintenant", hero_cta2: "Découvrir nos formations",
      stats_programs: "Formations publiées", stats_projects: "Projets étudiants",
      stats_partners: "Partenaires", stats_events: "Événements à venir",
      formations_eyebrow: "Nos programmes", formations_title: "Explorez nos formations",
      formations_lede: "Chargées directement depuis le back-office — aucune formation n'est codée en dur ici.",
      filter_all: "Tous", filter_info: "Informatique", filter_ia: "IA & Data",
      filter_electro: "Électronique", filter_robo: "Robotique",
      discover: "Découvrir →",
      news_eyebrow: "Vogt News", news_title: "Actualités",
      events_eyebrow: "Agenda", events_title: "Événements à venir",
      cta_title: "Votre aventure d'ingénieur commence ici.",
      cta_text: "Candidature 100% numérique — suivez votre dossier en ligne, de la soumission à l'admission.",
      cta_button: "Commencer ma candidature",
      footer_tagline: "Une école de l'INUCASTY",
      empty_programs: "Aucune formation publiée pour le moment. Revenez bientôt.",
      empty_news: "Aucun article publié pour le moment.",
      empty_events: "Aucun événement programmé pour le moment.",
      search_placeholder: "génie logiciel, admissions, hackathon...",
      search_button: "Rechercher", search_title: "Que recherchez-vous ?",
      login_email: "Email", login_password: "Mot de passe", login_submit: "Se connecter",
      forgot_password: "Mot de passe oublié ?",
    },
    en: {
      nav_formations: "Programs", nav_admissions: "Admissions", nav_actualites: "News",
      nav_evenements: "Events", nav_espace_etudiant: "Student Portal", nav_accueil: "Home",
      btn_connexion: "Log in", btn_candidater: "Apply now",
      hero_title: "Training the engineers who will build tomorrow.",
      hero_lede: "Higher education focused on engineering, technology and entrepreneurship — software engineering, AI, data science, electronics and robotics.",
      hero_cta1: "Apply now", hero_cta2: "Discover our programs",
      stats_programs: "Published programs", stats_projects: "Student projects",
      stats_partners: "Partners", stats_events: "Upcoming events",
      formations_eyebrow: "Our programs", formations_title: "Explore our programs",
      formations_lede: "Loaded directly from the back-office — nothing here is hardcoded.",
      filter_all: "All", filter_info: "Computer Science", filter_ia: "AI & Data",
      filter_electro: "Electronics", filter_robo: "Robotics",
      discover: "Discover →",
      news_eyebrow: "Vogt News", news_title: "News",
      events_eyebrow: "Agenda", events_title: "Upcoming events",
      cta_title: "Your engineering journey starts here.",
      cta_text: "100% digital application — track your file online, from submission to admission.",
      cta_button: "Start my application",
      footer_tagline: "A school of INUCASTY",
      empty_programs: "No programs published yet. Check back soon.",
      empty_news: "No articles published yet.",
      empty_events: "No events scheduled yet.",
      search_placeholder: "software engineering, admissions, hackathon...",
      search_button: "Search", search_title: "What are you looking for?",
      login_email: "Email", login_password: "Password", login_submit: "Log in",
      forgot_password: "Forgot your password?",
    },
  };

  function getLang() { return localStorage.getItem(LANG_KEY) || "fr"; }
  function setLang(lang) { localStorage.setItem(LANG_KEY, lang); apply(); }

  function apply() {
    const lang = getLang();
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[lang][key]) el.textContent = dict[lang][key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[lang][key]) el.setAttribute("placeholder", dict[lang][key]);
    });
    document.querySelectorAll(".lang-switch [data-lang]").forEach(btn => {
      btn.classList.toggle("active-lang", btn.dataset.lang === lang);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    apply();
    document.querySelectorAll(".lang-switch [data-lang]").forEach(btn => {
      btn.addEventListener("click", () => { setLang(btn.dataset.lang); window.location.reload(); });
    });
  });

  return { getLang, setLang };
})();
