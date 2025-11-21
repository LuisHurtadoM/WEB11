/*! readmore-cards.js (CORREGIDO: Respeta formato HTML y Listas)
 * 1. Inyecta estilos para truncado visual (max-height) en lugar de cortar texto.
 * 2. Mantiene listas, negritas y estructura HTML original.
 * 3. Incluye la lógica del carrusel automático.
 */
(function () {
  "use strict";
  if (window.__cardsReadmoreEnhanced__) return;
  window.__cardsReadmoreEnhanced__ = true;

  // --- 1. INYECTOR DE CSS (Estilos funcionales y Anti-Controles) ---
  function injectStyles() {
    if (document.getElementById('readmore-injected-styles')) return;
    const style = document.createElement('style');
    style.id = 'readmore-injected-styles';
    style.innerHTML = `
      /* Ocultar controles de galerías externas */
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

      /* Estilos para el truncado visual que RESPETA HTML */
      .readmore-wrapper {
        display: block;
        overflow: hidden;
        max-height: 180px; /* Altura del contenido visible cuando está cerrado */
        position: relative;
        transition: max-height 0.5s ease;
        
        /* Máscara de degradado para suavizar el corte */
        mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
        -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
      }

      /* Estado expandido */
      .card.is-expanded .readmore-wrapper {
        max-height: none; /* Muestra todo el contenido */
        overflow: visible;
        mask-image: none;
        -webkit-mask-image: none;
      }

      /* Botón Leer más */
      .read-toggle {
        margin-top: 1rem;
        display: inline-block;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
  injectStyles();

  // --- CONFIGURACIÓN ---
  const CARD_SEL = ".card";
  // Excluimos las noticias porque esas las gestiona main.js
  const EXCLUDE_SEL = ".news-item"; 
  // Elementos que ignoramos al buscar el contenido (footer, header, etc.)
  const SKIP_TAGS = /^(button|nav|footer|header|script|style)$/i;
  // Detectar encabezados para saber dónde empezar a envolver
  const IS_HEADER = /^h[1-6]$/i;

  // --- 2. LÓGICA DE SELECCIÓN DE CONTENIDO ---
  function pickContentNodes(card) {
    const kids = Array.from(card.children);
    if (!kids.length) return [];

    let startIndex = 0;
    // Buscamos el último título (h3, h4...) para empezar el contenido justo después
    const lastHeaderIndex = kids.findLastIndex(el => IS_HEADER.test(el.tagName));
    
    if (lastHeaderIndex !== -1) {
      startIndex = lastHeaderIndex + 1;
    }

    // Filtramos nodos que no queremos mover (botones existentes, etc.)
    const contentNodes = kids.slice(startIndex).filter(el => !SKIP_TAGS.test(el.tagName));
    
    return contentNodes;
  }

  function ensureBtn(card) {
    let btn = card.querySelector(":scope > .read-toggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "read-toggle btn btn--sm";
      card.appendChild(btn); // Añadimos el botón al final de la tarjeta
    }
    btn.textContent = "Leer más";
    btn.setAttribute("aria-expanded", "false");
    return btn;
  }

  // --- 3. FUNCIÓN PRINCIPAL DE MEJORA (ENHANCE) ---
  function enhance(card) {
    if (card.dataset.cardReadmore === "1") return;
    if (card.matches(EXCLUDE_SEL)) return; // No tocar noticias

    const nodesToWrap = pickContentNodes(card);
    if (!nodesToWrap.length) return;

    // Calculamos si el contenido es suficientemente largo para necesitar truncado
    // Sumamos la altura aproximada de los elementos
    let totalHeight = 0;
    nodesToWrap.forEach(node => totalHeight += node.offsetHeight || 20);

    // Si el contenido es pequeño (menos de 200px), no hacemos nada
    if (totalHeight < 220) return;

    // --- AQUÍ ESTÁ LA MAGIA: Envolver sin destruir HTML ---
    const wrapper = document.createElement("div");
    wrapper.className = "readmore-wrapper";

    // Insertamos el wrapper antes del primer nodo de contenido
    const firstNode = nodesToWrap[0];
    firstNode.parentNode.insertBefore(wrapper, firstNode);

    // Movemos los nodos originales DENTRO del wrapper (preservando formato)
    nodesToWrap.forEach(node => wrapper.appendChild(node));

    card.dataset.cardReadmore = "1";
    const btn = ensureBtn(card);

    // --- 4. LÓGICA DEL CLICK ---
    btn.addEventListener("click", () => {
      const isExpanded = card.classList.contains("is-expanded");

      if (isExpanded) {
        // CONTRAER
        card.classList.remove("is-expanded");
        btn.textContent = "Leer más";
        btn.setAttribute("aria-expanded", "false");
      } else {
        // EXPANDIR
        card.classList.add("is-expanded");
        btn.textContent = "Leer menos";
        btn.setAttribute("aria-expanded", "true");

        // --- 5. LÓGICA DEL CARRUSEL (TU CÓDIGO ORIGINAL) ---
        const carouselElement = card.querySelector('#carrusel-bloque1');
        if (carouselElement && !carouselElement.dataset.isInitialized) {
            
            let imagenesParaCarrusel = [];
            const currentPage = window.location.pathname.split('/').pop();

            if (currentPage === 'VazquezVarela.html' || window.location.href.includes('VazquezVarela')) {
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
            } else if (currentPage === 'Bouzas.html' || window.location.href.includes('Bouzas')) {
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

  // --- INICIALIZACIÓN ---
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