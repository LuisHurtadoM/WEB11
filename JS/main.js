// Centro de Día — main.js (MODIFICADO 2025)
// - Tema claro/oscuro robusto
// - Delegación global para botones "Leer más" (Formato inmediato)
// - Consentimiento de cookies unificado
// - Lógica de noticias unificada con BÚSQUEDA Y FILTROS
// - Scripts globales [data-today]

(() => {
  "use strict";
  const STORAGE_THEME = "cd_theme";
  const COOKIE_NAME = "cookie_consent";

  // -- VARIABLES PARA GESTIONAR LAS NOTICIAS --
  let allNewsItems = []; 
  let newsContainerId = ''; 

  // ============ Tema claro/oscuro ============
  const html = document.documentElement;

  function applyTheme(mode) {
    const m = (mode === "theme-dark" || mode === "dark") ? "theme-dark" : "theme-light";
    html.classList.remove("theme-light", "theme-dark");
    html.classList.add(m);
    try { localStorage.setItem(STORAGE_THEME, m); } catch (e) {console.error("Error al guardar en localStorage:", e)}
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      btn.setAttribute("aria-pressed", m === "theme-dark" ? "true" : "false");
      btn.setAttribute("title", m === "theme-dark" ? "Cambiar a claro" : "Cambiar a oscuro");
      btn.innerHTML = (m === "theme-dark" ? "☀️ Claro" : "🌙 Oscuro");
    });
  }

  let initial = "theme-light";
  try {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved === "theme-dark") initial = "theme-dark";
  } catch {}
  if (!initial && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    initial = "theme-dark";
  }
  applyTheme(initial);

  document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const current = html.classList.contains("theme-dark") ? "theme-dark" : "theme-light";
      applyTheme(current === "theme-dark" ? "theme-light" : "theme-dark");
    });
  });
  
/* === FUNCIONES OBSOLETAS (Se mantienen vacías o ignoradas para evitar errores si se llaman) === */
// Al usar marked.parse directamente en la creación, ya no necesitamos estas funciones de transformación dinámica.
function NETAVO_toRichHTML(raw) { return marked.parse(raw || ""); }
function NETAVO_primeContent(contentEl) {}
function NETAVO_applyFormatting(readmoreBox, expand) {}

 // ============ Lógica Universal y Unificada de "Leer más" ============
 // MODIFICADO: Ahora solo gestiona la expansión visual, el formato ya viene listo.
document.body.addEventListener("click", e => {
  const btn = e.target.closest('.news-item .readmore__toggle');
  if (!btn) return;

  const readmoreBox = btn.closest('.readmore');
  if (!readmoreBox) return;

  const isExpanded = readmoreBox.getAttribute("data-expanded") === "true";
  const expand = !isExpanded;

  // Simplemente cambiamos el atributo. CSS se encarga de mostrar/ocultar el resto.
  readmoreBox.setAttribute("data-expanded", String(expand));
  btn.textContent = expand ? "Leer menos" : "Leer más";
  btn.setAttribute("aria-expanded", String(expand));
  
  // NOTA: Hemos eliminado la llamada a NETAVO_applyFormatting aquí porque el HTML ya es rico.
});

// ============ Banners y cookies - Lógica unificada ============

function setCookieConsent(preferences) {
  try {
    localStorage.setItem(COOKIE_NAME, JSON.stringify(preferences));
  } catch (e) {
    console.error("Error al guardar el consentimiento de cookies:", e);
  }
  
  const banner = document.getElementById("cookie-banner");
  if (banner) {
    banner.style.display = "none";
  }

  const toast = document.getElementById("cookie-toast");
  if (toast) {
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
}

function handleCookieButtons() {
  const banner = document.getElementById("cookie-banner");
  if (!banner) return;

  const acceptAllButton = banner.querySelector('[data-cookie="accept-all"]');
  const acceptSelectedButton = banner.querySelector('[data-cookie="accept-selected"]');
  const rejectButton = banner.querySelector('[data-cookie="reject-all"]');

  if (acceptAllButton) {
    acceptAllButton.addEventListener("click", () => {
      const preferences = {
        necessary: true,
        analytics: true,
        personalization: true,
        timestamp: new Date().toISOString()
      };
      setCookieConsent(preferences);
    });
  }

  if (acceptSelectedButton) {
    acceptSelectedButton.addEventListener("click", () => {
      const analyticsChecked = banner.querySelector('input[value="analytics"]').checked;
      const personalizationChecked = banner.querySelector('input[value="personalization"]').checked;
      const preferences = {
        necessary: true,
        analytics: analyticsChecked,
        personalization: personalizationChecked,
        timestamp: new Date().toISOString()
      };
      setCookieConsent(preferences);
    });
  }

  if (rejectButton) {
    rejectButton.addEventListener("click", () => {
      const preferences = {
        necessary: true,
        analytics: false,
        personalization: false,
        timestamp: new Date().toISOString()
      };
      setCookieConsent(preferences);
    });
  }
}

window.addEventListener("load", () => {
    const banner = document.getElementById("cookie-banner");
    if (banner && !localStorage.getItem(COOKIE_NAME)) {
        banner.style.display = "block";
        handleCookieButtons();
    }
});

  // ============ Lógica de Noticias (con Búsqueda y Filtros) ============
  function parseNewsItems(text) {
    const R = ['title', 'date', 'url'];
    const esc = s => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
    const rawItems = text.replace(/\r\n/g, '\n').trim();
    if (!rawItems) return [];
    return rawItems.split(/\n-{3,}\n/).map((block, i) => {
        const lines = block.split('\n');
        const data = {};
        let isBody = false, bodyLines = [];
        for (const line of lines) {
            if (/^\s*#/.test(line)) continue;
            if (!isBody) {
                const match = line.match(/^\s*([a-zA-Z]+)\s*:\s*(.*)\s*$/);
                if (match) {
                    const key = match[1].toLowerCase();
                    const value = match[2].trim();
                    data[key] = value;
                    if (key === 'tags') {
                        data.tagsArray = value.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
                    }
                }
                if (/^\s*$/.test(line)) { isBody = true; continue; }
            } else {
              bodyLines.push(line);
            }
        }
        data.excerpt = data.excerpt || bodyLines.join('\n').trim();
        const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(data.date || '');
        data._dt = dateOk ? new Date(data.date + 'T00:00:00') : null;
        data._valid = R.every(k => (data[k] || '').trim()) && !!data._dt;
        data._id = 'news-item-' + (i + 1);
        data.esc = esc;
        return data;
    });
}

function createNewsCard(n) {
    if (n.anchorto) {
        const targetId = `news-item-${n.anchorto}`;
        const linkText = "te ayudamos a escoger";
        const anchorLink = `<a href="#${targetId}" class="anchor-link" data-anchor-target="#${targetId}">${linkText}</a>`;
        if (n.excerpt) {
            n.excerpt = n.excerpt.replace('[ENLACE_A_NOTICIA]', anchorLink);
        }
    }

    const ds = n._dt ? n._dt.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : n.esc(n.date);
    
    const tagsHtml = (n.tagsArray && n.tagsArray.length > 0)
      ? n.tagsArray.map(tag => `<span class="tag tag--brand" style="text-transform: capitalize;">${n.esc(tag)}</span>`).join(' ')
      : (n.kicker ? `<span class="tag tag--brand">${n.esc(n.kicker)}</span>` : '');

    // --- CAMBIO PRINCIPAL AQUÍ ---
    // Usamos marked.parse() directamente para que el extracto YA tenga formato (listas, negritas)
    // Añadimos la clase 'is-rich' para que el CSS sepa que es contenido HTML complejo
    const excerptHtml = n.excerpt 
        ? `<div class="readmore__content is-rich">${marked.parse(n.excerpt)}</div>` 
        : '';

    return `
    <article class="news-item card" id="${n._id}">
      <div class="news-item__media" aria-hidden="true">
        <a href="${n.url}" target="_blank" rel="noopener"><img src="${n.esc(n.image)}" alt="${n.esc(n.title)}"></a>
      </div>
      <div class="news-item__content">
        <h4><a href="${n.url}" target="_blank" rel="noopener">${n.esc(n.title)}</a></h4>
        <div class="news-item__meta muted">${ds} ${tagsHtml ? ('• ' + tagsHtml) : ''}</div>
        
        <div class="readmore" data-expanded="false">
          ${excerptHtml || ''}
          ${excerptHtml ? '<div class="readmore__fade"></div><button class="btn btn--sm readmore__toggle" type="button">Leer más</button>' : ''}
        </div>
      </div>
    </article>`;
}

function paintNews(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (items.length > 0) {
        container.innerHTML = items.map(createNewsCard).join('');
    } else {
        container.innerHTML = `<p class="muted" style="grid-column: 1 / -1;">No se han encontrado noticias que coincidan con tu búsqueda.</p>`;
    }
}

function populateFilters() {
  const filtersContainer = document.getElementById('news-filters');
  if (!filtersContainer) return;

  const allTags = new Set();
  allNewsItems.forEach(item => {
      if (item.tagsArray) {
          item.tagsArray.forEach(tag => allTags.add(tag));
      }
  });

  let buttonsHtml = '<button class="filter-btn active" data-filter="all">Mostrar Todas</button>';
  const sortedTags = Array.from(allTags).sort();
  sortedTags.forEach(tag => {
      buttonsHtml += `<button class="filter-btn" data-filter="${tag}" style="text-transform: capitalize;">${tag}</button>`;
  });

  filtersContainer.innerHTML = buttonsHtml;
}

function filterAndRenderNews() {
  const searchInput = document.getElementById('news-search-input');
  const filtersContainer = document.getElementById('news-filters');
  
  if (!searchInput || !filtersContainer) return;

  const searchTerm = searchInput.value.toLowerCase().trim();
  const activeFilter = filtersContainer.querySelector('.filter-btn.active').dataset.filter;

  const filteredItems = allNewsItems.filter(item => {
      const tagMatch = (activeFilter === 'all') || (item.tagsArray && item.tagsArray.includes(activeFilter));
      const searchMatch = !searchTerm || 
                          item.title.toLowerCase().includes(searchTerm) || 
                          item.excerpt.toLowerCase().includes(searchTerm);
      return tagMatch && searchMatch;
  });

  paintNews(filteredItems, newsContainerId);
}

function setupNewsControls() {
  const searchInput = document.getElementById('news-search-input');
  const filtersContainer = document.getElementById('news-filters');

  if (searchInput) {
      searchInput.addEventListener('input', filterAndRenderNews);
  }
  
  if (filtersContainer) {
      filtersContainer.addEventListener('click', e => {
          if (e.target.classList.contains('filter-btn')) {
              filtersContainer.querySelector('.active').classList.remove('active');
              e.target.classList.add('active');
              filterAndRenderNews();
          }
      });
  }
}

// MODIFICADO: window.loadAndPaintNews debe ser global para ser llamado desde los HTML
window.loadAndPaintNews = async function(url, containerId, maxItems) {
    newsContainerId = containerId;
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        const items = parseNewsItems(text);
        
        allNewsItems = items.filter(n => n._valid).sort((a, b) => (b._dt?.getTime() || 0) - (a._dt?.getTime() || 0));

        const itemsToRender = maxItems ? allNewsItems.slice(0, maxItems) : allNewsItems;

        paintNews(itemsToRender, containerId);

        if (document.getElementById('news-filters')) {
          populateFilters();
          setupNewsControls();
        }

    } catch (e) {
        console.error(`Error al cargar noticias desde ${url}:`, e);
    }
}

// ============ Lógica para Anclas que expanden Noticias ============
document.body.addEventListener('click', e => {
    const anchor = e.target.closest('a.anchor-link');
    if (!anchor) return;
    e.preventDefault();
    const targetId = anchor.dataset.anchorTarget;
    if (!targetId) return;
    const targetArticle = document.querySelector(targetId);
    if (!targetArticle) return;
    const readMoreButton = targetArticle.querySelector('.readmore__toggle');
    const readmoreBox = targetArticle.querySelector('.readmore');
    if (readMoreButton && readmoreBox.getAttribute('data-expanded') !== 'true') {
        readMoreButton.click();
    }
    targetArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Mantenemos las llamadas originales (por compatibilidad si se usaban)
window.noti1 = function() { loadAndPaintNews('./noticias.txt', 'news-centro', 1); };
window.noti2 = function() { loadAndPaintNews('./noticias-familias.txt', 'news-familias', 1); };
window.noti3 = function() { loadAndPaintNews('./noticias-profesionales.txt', 'news-profesionales', 1); };

  // ============ [data-today] y otros scripts globales ============
  const todayEls = document.querySelectorAll("[data-today]");
  if (todayEls) {
    const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    todayEls.forEach(el => el.textContent = today);
  }

  // Cierre automático de menús desplegables
  document.addEventListener('click', e => {
    document.querySelectorAll('details.menu-dd').forEach(details => {
      if (details.open && !details.contains(e.target)) {
        details.open = false;
      }
    });
  });

  // ============ Carrusel de imágenes ============
  (function() {
    const images = [
      './imagenes/alterna1.jpeg', './imagenes/alterna2.jpeg', './imagenes/alterna3.jpeg',
      './imagenes/alterna4.jpg', './imagenes/alterna5.jpeg', './imagenes/alterna6.jpeg', './imagenes/alterna7.jpeg'
    ];
    const imageElement = document.getElementById('imagenalternada');
    let currentIndex = 0;

    function updateImage() {
      if (!imageElement) return;
      currentIndex = (currentIndex + 1) % images.length;
      imageElement.src = images[currentIndex];
    }
    if (imageElement) {
        setInterval(updateImage, 3000);
    }
  })();
  
  // ============ Menú móvil ============
  function setupMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelectorAll('.nav a, .nav .menu-dd__list a');

    if (!navToggle) return;

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navToggle.checked) {
          navToggle.checked = false;
        }
      });
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
  });

  // ============ Header Fijo (Sticky Fallback) ============
  (function () {
    var header = document.querySelector('.header');
    if (!header) return;

    var sentinel = document.createElement('div');
    sentinel.setAttribute('data-sticky-sentinel', '');
    header.parentNode.insertBefore(sentinel, header);

    function syncHeaderHeight() {
      var h = header.offsetHeight || 0;
      document.documentElement.style.setProperty('--header-h', h + 'px');
    }

    var io = new IntersectionObserver(function (entries) {
      var e = entries[0];
      if (!e) return;
      if (e.intersectionRatio === 0 && e.boundingClientRect.top < 0) {
        if (!header.classList.contains('is-fixed')) {
          header.classList.add('is-fixed');
          syncHeaderHeight();
        }
      } else {
        header.classList.remove('is-fixed');
        syncHeaderHeight();
      }
    }, { threshold: [0] });

    io.observe(sentinel);
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight, { passive: true });

    ['click', 'change', 'transitionend'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        requestAnimationFrame(syncHeaderHeight);
      }, { passive: true });
    });
  })();

  // ============ Spacer dinámico ============
  (function () {
    var header = document.querySelector('.header');
    var spacer = document.querySelector('[data-header-spacer]');
    if (!header || !spacer) return;

    function updateSpacer() {
      if (header.classList.contains('is-fixed')) {
        spacer.style.height = (header.offsetHeight || 0) + 'px';
      } else {
        spacer.style.height = '0px';
      }
    }
    
    function syncAndUpdate() {
        var h = header.offsetHeight || 0;
        document.documentElement.style.setProperty('--header-h', h + 'px');
        updateSpacer();
    }

    syncAndUpdate();
    window.addEventListener('resize', syncAndUpdate, { passive: true });
    ['click','change','transitionend'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        requestAnimationFrame(syncAndUpdate);
      }, { passive: true });
    });
  })();
  
  // ============ Sincronizar clase en Body para menú abierto ============
  (function(){
    var t = document.getElementById('nav-toggle') || document.querySelector('.nav-toggle');
    if(!t) return;

    function sync(){ document.body.classList.toggle('nav-open', !!t.checked); }
    document.addEventListener('DOMContentLoaded', sync);
    t.addEventListener('change', sync);

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && t.checked){ t.checked = false; sync(); }
    });

    document.addEventListener('click', function(e){
      if(!document.body.classList.contains('nav-open')) return;
      if(e.target.closest('.nav') || e.target.closest('.nav-burger')) return;
      t.checked = false; sync();
    }, {capture:true});
  })();

})();