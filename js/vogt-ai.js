/**
 * VOGT AI — assistant simple base sur mots-cles, jamais sur une IA generative.
 * Il ne repond qu'a partir des donnees publiees (FAQ + formations) via l'API
 * publique, exactement comme l'exige le cahier des charges : "ne jamais
 * inventer d'information". Pas de LLM branche a ce stade.
 */
(function () {
  function injectWidget() {
    const bubble = document.createElement("button");
    bubble.id = "vogtAiBubble";
    bubble.innerHTML = "💬";
    bubble.style.cssText = `
      position:fixed; bottom:20px; right:20px; width:56px; height:56px; border-radius:50%;
      background:#6366F1; color:#fff; border:none; font-size:1.4rem; cursor:pointer;
      box-shadow:0 8px 24px rgba(0,0,0,.2); z-index:250;`;
    document.body.appendChild(bubble);

    const panel = document.createElement("div");
    panel.id = "vogtAiPanel";
    panel.style.cssText = `
      position:fixed; bottom:86px; right:20px; width:min(90vw,340px); max-height:60vh;
      background:rgba(255,255,255,.97); backdrop-filter:blur(10px); border-radius:16px;
      box-shadow:0 12px 40px rgba(0,0,0,.2); z-index:250; display:none; flex-direction:column;
      overflow:hidden; font-family:'Inter',sans-serif;`;
    panel.innerHTML = `
      <div style="background:#111827; color:#fff; padding:14px 16px; display:flex; justify-content:space-between; align-items:center;">
        <strong style="font-size:.9rem;">Vogt AI</strong>
        <button id="vogtAiClose" style="background:none; border:none; color:#fff; cursor:pointer; font-size:1rem;">✕</button>
      </div>
      <div id="vogtAiMessages" style="flex:1; overflow-y:auto; padding:14px; font-size:.86rem; display:flex; flex-direction:column; gap:10px;"></div>
      <form id="vogtAiForm" style="display:flex; border-top:1px solid #e5e7eb;">
        <input id="vogtAiInput" placeholder="Posez votre question..." style="flex:1; border:none; padding:12px; font-size:.86rem; outline:none;">
        <button type="submit" style="background:#6366F1; color:#fff; border:none; padding:0 16px; cursor:pointer;">→</button>
      </form>
    `;
    document.body.appendChild(panel);

    bubble.addEventListener("click", () => {
      const open = panel.style.display === "flex";
      panel.style.display = open ? "none" : "flex";
      if (!open && panel.dataset.greeted !== "1") {
        addMessage("bot", "Bonjour 👋 Je peux répondre à vos questions sur les formations et les admissions, à partir des informations publiées par Vogt High Tech. Que voulez-vous savoir ?");
        panel.dataset.greeted = "1";
      }
    });
    document.getElementById("vogtAiClose").addEventListener("click", () => { panel.style.display = "none"; });

    document.getElementById("vogtAiForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("vogtAiInput");
      const question = input.value.trim();
      if (!question) return;
      addMessage("user", question);
      input.value = "";
      await answer(question);
    });
  }

  function addMessage(from, text) {
    const messages = document.getElementById("vogtAiMessages");
    const bubble = document.createElement("div");
    bubble.style.cssText = from === "user"
      ? "align-self:flex-end; background:#6366F1; color:#fff; padding:9px 13px; border-radius:14px 14px 2px 14px; max-width:85%;"
      : "align-self:flex-start; background:#F3F4F6; color:#111827; padding:9px 13px; border-radius:14px 14px 14px 2px; max-width:85%;";
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(question) {
    try {
      const r = await VogtAPI.search(question);
      if (r.faq && r.faq.length > 0) {
        addMessage("bot", r.faq[0].answer);
        return;
      }
      if (r.programs && r.programs.length > 0) {
        const p = r.programs[0];
        addMessage("bot", `${p.name} — ${p.shortDescription || ""} (Durée : ${p.durationLabel || "non précisée"}). Plus de détails : formation.html?slug=${p.slug}`);
        return;
      }
      if (r.news && r.news.length > 0) {
        addMessage("bot", `Actualité trouvée : "${r.news[0].title}".`);
        return;
      }
      addMessage("bot", "Je n'ai pas trouvé d'information publiée à ce sujet. Contactez l'administration Vogt pour une réponse précise — je ne peux répondre qu'à partir des contenus déjà publiés sur le site.");
    } catch (err) {
      addMessage("bot", "Le service de recherche est momentanément indisponible.");
    }
  }

  document.addEventListener("DOMContentLoaded", injectWidget);
})();
