/*! readmore-cards.js (VERSIÓN DEFINITIVA con carrusel integrado y anti-controles)
 * Crea un carrusel simple y automático e inyecta CSS para ocultar
 * controles de otras librerías de galerías que puedan interferir.
 */
(function () {
  "use strict";
  if (window.__cardsReadmoreEnhanced__) return;
  window.__cardsReadmoreEnhanced__ = true;

  // --- NUEVO: Inyector de CSS Anti-Controles ---
  // Esta función se ejecuta una vez y añade una regla de estilo
  // para ocultar los controles de galerías dentro de nuestro carrusel.
  function injectCarouselStyles() {
    if (document.getElementById('carousel-override-styles')) return;
    const style = document.createElement('style');
    style.id = 'carousel-override-styles';
    style.innerHTML = `
      #carrusel-bloque1 button,
      #carrusel-bloque1 [class*="toolbar"],
      #carrusel-bloque1 [class*="caption"],
      #carrusel-bloque1 [class*="actions"],
      #carrusel-bloque1 [class*="counter"],
      #carrusel-bloque1 [class*="sub-html"],
      #carrusel-bloque1 [class*="lg-"] {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
  }
  injectCarouselStyles();
  // --- FIN DEL INYECTOR ---

  const LIMIT = 80;
  const CARD_SEL = ".card";
  const EXCLUDE_SEL = ".news-item";
  const SKIP = /^(button|nav|footer|header|figure|img|video|audio|canvas|iframe|script|style)$/i;
  const IS_H = /^h[1-6]$/i;

  function words(t){ return String(t||"").trim().replace(/\s+/g," ").split(" ").filter(Boolean); }
  function escape(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  
  function truncate(text, max){
    const w = words(text);
    if (w.length <= max) return { html: `<p>${escape(text)}</p>`, cut: false };
    return { html: `<p>${escape(w.slice(0,max).join(" "))}…</p>`, cut: true };
  }

  function pickRegion(card){
    const kids = Array.from(card.children);
    if (!kids.length) return null;
    let start = 0;
    const hidx = kids.findIndex(el => IS_H.test(el.tagName));
    if (hidx !== -1) start = hidx + 1;
    let region = kids.slice(start).filter(el => !SKIP.test(el.tagName));
    if (!region.length) region = kids.slice(start);
    return region.length ? region : null;
  }
  
  function regionHTML(nodes){ return nodes.map(n => n.outerHTML).join(""); }
  function regionText(nodes){ return nodes.map(n => n.textContent || "").join(" ").replace(/\s+/g," ").trim(); }
  
  function ensureBtn(card){
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
  
  function enhance(card){
    if (card.dataset.cardReadmore === "1") return;
    if (card.matches(EXCLUDE_SEL)) return;

    const region = pickRegion(card);
    if (!region) return;

    const parent = region[0].parentNode;
    const ref = region[0];
    const originalHTML = regionHTML(region);
    
    const { html: truncatedHTML, cut } = truncate(regionText(region), LIMIT);

    const wrap = document.createElement("div");
    wrap.className = "readmore-wrapper";
    const content = document.createElement("span");
    content.className = "readmore-content";
    content.innerHTML = truncatedHTML;
    wrap.appendChild(content);
    parent.insertBefore(wrap, ref);
    region.forEach(n => n.parentNode && n.parentNode.removeChild(n));

    card.dataset.cardReadmore = "1";

    if (!cut) return;

    const btn = ensureBtn(card);
    card.dataset.originalHtml = originalHTML;

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      if (expanded){
        content.innerHTML = truncate(regionText(region), LIMIT).html;
        btn.textContent = "Leer más";
        btn.setAttribute("aria-expanded","false");
        card.classList.remove("is-expanded");
      } else {
        content.innerHTML = card.dataset.originalHtml || content.innerHTML;
        btn.textContent = "Leer menos";
        btn.setAttribute("aria-expanded","true");
        card.classList.add("is-expanded");

        const carouselElement = card.querySelector('#carrusel-bloque1');
        if (carouselElement && !carouselElement.dataset.isInitialized) {
            
            let imagenesParaCarrusel = [];
            const currentPage = window.location.pathname.split('/').pop();

            if (currentPage === 'VazquezVarela.html') {
                imagenesParaCarrusel = [
                    'imagenes/fotos/VazquezVarela/3.jpg','imagenes/fotos/VazquezVarela/4.jpg','imagenes/fotos/VazquezVarela/5.jpg',
                    'imagenes/fotos/VazquezVarela/6.jpg','imagenes/fotos/VazquezVarela/7.jpg','imagenes/fotos/VazquezVarela/8.jpg',
                    'imagenes/fotos/VazquezVarela/9.jpg','imagenes/fotos/VazquezVarela/10.jpg','imagenes/fotos/VazquezVarela/11.jpg',
                    'imagenes/fotos/VazquezVarela/12.jpg','imagenes/fotos/VazquezVarela/13.jpg','imagenes/fotos/VazquezVarela/14.jpg',
                    'imagenes/fotos/VazquezVarela/15.jpg','imagenes/fotos/VazquezVarela/16.jpg','imagenes/fotos/VazquezVarela/17.jpg',
                    'imagenes/fotos/VazquezVarela/18.jpg','imagenes/fotos/VazquezVarela/19.jpg','imagenes/fotos/VazquezVarela/20.jpg',
                    'imagenes/fotos/VazquezVarela/21.jpg','imagenes/fotos/VazquezVarela/22.jpg','imagenes/fotos/VazquezVarela/23.jpg',
                    'imagenes/fotos/VazquezVarela/24.jpg','imagenes/fotos/VazquezVarela/25.jpg','imagenes/fotos/VazquezVarela/26.jpg',
                    'imagenes/fotos/VazquezVarela/27.jpg',
                ];
            } else if (currentPage === 'Bouzas.html') {
                imagenesParaCarrusel = [
                    'imagenes/fotos/Bouzas/3.jpg','imagenes/fotos/Bouzas/4.jpg','imagenes/fotos/Bouzas/5.jpg','imagenes/fotos/Bouzas/6.jpg',
                    'imagenes/fotos/Bouzas/7.jpg','imagenes/fotos/Bouzas/8.jpg','imagenes/fotos/Bouzas/9.jpg','imagenes/fotos/Bouzas/11.jpg',
                    'imagenes/fotos/Bouzas/12.jpg','imagenes/fotos/Bouzas/13.jpg','imagenes/fotos/Bouzas/14.jpg','imagenes/fotos/Bouzas/15.jpg',
                    'imagenes/fotos/Bouzas/16.jpg','imagenes/fotos/Bouzas/17.jpg','imagenes/fotos/Bouzas/18.jpg','imagenes/fotos/Bouzas/19.jpg',
                    'imagenes/fotos/Bouzas/20.jpg','imagenes/fotos/Bouzas/21.jpg','imagenes/fotos/Bouzas/22.jpg','imagenes/fotos/Bouzas/23.jpg',
                    'imagenes/fotos/Bouzas/24.jpg',
                ];
            }

            if (imagenesParaCarrusel.length > 0) {
                carouselElement.innerHTML = '';
                const img = document.createElement('img');
                img.style.cssText = 'width:100%; display:block; aspect-ratio: 16/10; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--border);';
                carouselElement.appendChild(img);
                
                let currentIndex = 0;
                const changeImage = () => {
                    img.src = imagenesParaCarrusel[currentIndex];
                    currentIndex = (currentIndex + 1) % imagenesParaCarrusel.length;
                };
                
                changeImage();
                setInterval(changeImage, 3000);
                
                carouselElement.dataset.isInitialized = 'true';
            }
        }
      }
    });
  }

  function init(){
    const cards = Array.from(document.querySelectorAll(CARD_SEL)).filter(c => !c.matches(EXCLUDE_SEL));
    if (!cards.length) return false;
    cards.forEach(enhance);
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
  } else {
    boot();
  }
})();