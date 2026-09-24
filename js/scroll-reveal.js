/**
 * Révélation douce au défilement (fade + léger déplacement vers le haut) sur
 * les sections principales — donne un rendu plus éditorial/institutionnel
 * qu'un affichage figé d'un coup. Respecte prefers-reduced-motion.
 */
(function () {
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    const targets = document.querySelectorAll(
      "section > .wrap > .section-head, .why-row, .prog-card, .lab-card, .proj-card, .news-card, .partner-logo, .timeline .tstep"
    );
    if (targets.length === 0) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("reveal-visible"));
      return;
    }

    targets.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("reveal-visible"), (i % 6) * 60);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  });
})();
