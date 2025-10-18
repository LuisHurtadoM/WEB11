/*! readmore.js v4 (para index)
 * Trunca .card (excepto .news-item) a 100 palabras
 * Botón 'Leer más / Leer menos' siempre visible
 * Reintentos de init (DOMContentLoaded, load, interval)
 */
(function () {
  "use strict";
  if (window.__readmoreEnhanced__) return; // idempotente
  window.__readmoreEnhanced__ = true;

  const WORD_LIMIT = 100;
  const CARD_SELECTOR = ".card";
  const EXCLUDE_SELECTOR = ".news-item";
  const AVOID_TAG_RE = /^(button|nav|footer|header|figure|img|video|audio|canvas|iframe|script|style)$/i;
  const HEADING_RE = /^h[1-6]$/i;

  function words(str){ return String(str||"").trim().replace(/\s+/g," ").split(" ").filter(Boolean); }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function truncateTo(text, max){
    const arr = words(text);
    if (arr.length <= max) return { html: `<p>${escapeHtml(text)}</p>`, truncated:false };
    return { html: `<p>${escapeHtml(arr.slice(0,max).join(" "))}…</p>`, truncated:true };
  }

  function pickRegion(card){
    const kids = Array.from(card.children);
    if (!kids.length) return null;
    let startIdx = 0;
    const hIdx = kids.findIndex(el => HEADING_RE.test(el.tagName));
    if (hIdx !== -1) startIdx = hIdx + 1;
    let region = kids.slice(startIdx).filter(el => !AVOID_TAG_RE.test(el.tagName));
    if (!region.length) region = kids.slice(startIdx);
    return region.length ? region : null;
  }
  function regionHTML(nodes){ return nodes.map(n=>n.outerHTML).join(""); }
  function regionText(nodes){ return nodes.map(n=>n.textContent||"").join(" ").replace(/\s+/g," ").trim(); }

  function ensureButton(card){
    let btn = card.querySelector(":scope > .read-toggle");
    if (!btn){
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "read-toggle btn btn--sm";
      card.appendChild(btn);
    }
    btn.hidden = false;
    btn.style.display = "inline-block";
    btn.textContent = "Leer más";
    btn.setAttribute("aria-expanded","false");
    return btn;
  }

  function enhanceCard(card){
    if (card.dataset.readmoreEnhanced === "1") return;
    if (card.matches(EXCLUDE_SELECTOR)) return;

    const region = pickRegion(card);
    if (!region) return;

    const parent = region[0].parentNode;
    const ref = region[0];

    const originalHTML = regionHTML(region);
    const originalText = regionText(region);
    const { html: truncatedHTML } = truncateTo(originalText, WORD_LIMIT);

    const wrap = document.createElement("div");
    wrap.className = "readmore-wrapper";
    const content = document.createElement("span");
    content.className = "readmore-content";
    content.innerHTML = truncatedHTML;
    wrap.appendChild(content);
    parent.insertBefore(wrap, ref);
    region.forEach(n => n.parentNode && n.parentNode.removeChild(n));

    const btn = ensureButton(card);
    card.dataset.originalHtml = originalHTML;
    card.dataset.originalText = originalText;

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      if (expanded){
        const t = truncateTo(card.dataset.originalText || "", WORD_LIMIT).html;
        content.innerHTML = t;
        btn.textContent = "Leer más";
        btn.setAttribute("aria-expanded","false");
        card.classList.remove("is-expanded");
      } else {
        content.innerHTML = card.dataset.originalHtml || content.innerHTML;
        btn.textContent = "Leer menos";
        btn.setAttribute("aria-expanded","true");
        card.classList.add("is-expanded");
      }
    });

    card.dataset.readmoreEnhanced = "1";
  }

  function init(){
    const cards = Array.from(document.querySelectorAll(CARD_SELECTOR))
      .filter(c => !c.matches(EXCLUDE_SELECTOR));
    if (!cards.length) return false;
    cards.forEach(enhanceCard);
    return true;
  }

  function boot(){
    if (init()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (init() || attempts >= 8) clearInterval(timer);
    }, 200);
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
    window.addEventListener("load", boot, { once: true });
  } else {
    boot();
    window.addEventListener("load", boot, { once: true });
  }
})();