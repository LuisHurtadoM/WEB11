// Centro de Día — main.js (FIX 2025-09-02)
// - Conserva todas las funciones previas
// - Resuelve casos donde el label se queda en "tema" añadiendo sincronización robusta
// - Soporta scripts que re-rendericen el botón (MutationObserver + re-sync)
(() => {
  "use strict";
  const STORAGE_THEME = "cd_theme";

  // ============ Tema claro/oscuro ============
  const html = document.documentElement;

  // Sincroniza todos los labels [data-theme-label] con el estado real del tema
  function syncThemeLabels() {
    const isDark = html.classList.contains('theme-dark') || html.classList.contains('dark');
    document.querySelectorAll('[data-theme-label]').forEach(l => {
      try { l.textContent = isDark ? 'claro' : 'oscuro'; } catch (e) {}
    });
  }

  function applyTheme(mode) {
    // Normalizar modo entrante a theme-dark / theme-light
    const m = (mode === "theme-dark" || mode === "dark") ? "theme-dark" : "theme-light";

    // Limpiar clases antiguas y añadir la correspondencia. Añadimos también 'dark' para compat.
    html.classList.remove("theme-light", "theme-dark", "dark", "light");
    html.classList.add(m);
    if (m === 'theme-dark') html.classList.add('dark');

    try { localStorage.setItem(STORAGE_THEME, m); } catch (e) {}

    // Actualizar atributos de accesibilidad y el label dentro de cada botón
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      try {
        btn.setAttribute("aria-pressed", m === "theme-dark" ? "true" : "false");
        btn.setAttribute("title", m === "theme-dark" ? "Cambiar a claro" : "Cambiar a oscuro");
        const label = btn.querySelector('[data-theme-label]');
        if (label) label.textContent = m === "theme-dark" ? "claro" : "oscuro";
      } catch (e) {}
    });

    // Asegurar sincronía global
    syncThemeLabels();
  }

  // Inicialización: respetar localStorage > clase html existente > prefers-color-scheme > light
  let initial = "theme-light";
  try {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved === "theme-dark" || saved === "theme-light") initial = saved;
    else if (html.classList.contains('dark') || html.classList.contains('theme-dark')) initial = 'theme-dark';
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) initial = "theme-dark";
  } catch (e) {}
  applyTheme(initial);

  // Delegación de eventos: toggle-theme y readmore-toggle
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest('[data-action="toggle-theme"]');
    if (t) {
      ev.preventDefault();
      const next = html.classList.contains("theme-dark") || html.classList.contains('dark') ? "theme-light" : "theme-dark";
      applyTheme(next);
    }

    const rm = ev.target.closest('[data-action="readmore-toggle"]');
    if (rm) {
      ev.preventDefault();
      const wrap = rm.closest(".readmore");
      if (!wrap) return;
      const expanded = wrap.getAttribute("data-expanded") === "true";
      wrap.setAttribute("data-expanded", expanded ? "false" : "true");
      rm.setAttribute("aria-expanded", expanded ? "false" : "true");
      rm.textContent = expanded ? "Leer más" : "Mostrar menos";
    }
  });

  // ===== MutationObserver: re-sincroniza etiquetas si el DOM reescribe el encabezado =====
  (function watchForThemeButtons(){
    const obs = new MutationObserver((mutations) => {
      let found = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const n of m.addedNodes) {
            if (!(n instanceof Element)) continue;
            if (n.matches && n.matches('[data-action="toggle-theme"]')) { found = true; break; }
            if (n.querySelector && n.querySelector('[data-action="toggle-theme"]')) { found = true; break; }
          }
        }
        if (m.type === 'attributes' && m.target && m.target.closest && m.target.closest('[data-action="toggle-theme"]')) {
          found = true;
        }
        if (found) break;
      }
      if (found) {
        // Debounce leve
        clearTimeout(window.__cd_sync_theme_label_timeout);
        window.__cd_sync_theme_label_timeout = setTimeout(() => {
          ensureThemeLabel();
          syncThemeLabels();
        }, 30);
      }
    });

    try {
      obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
    } catch (e) {}
  })();

  // Etiqueta y estructura del botón: si falta [data-theme-label] lo crea (preserva icono si hay)
  function ensureThemeLabel() {
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      try {
        const existing = btn.querySelector('[data-theme-label]');
        if (!existing) {
          const raw = btn.textContent || '';
          const hasIcon = /🌗|🌓|🌙|☾|☀|⛅/.test(raw);
          const icon = hasIcon ? '🌓 ' : '🌓 ';
          btn.innerHTML = icon + '<span data-theme-label></span>';
        }
      } catch (e) {}
    });
    // Forzar sincronización inmediata
    syncThemeLabels();
  }

  // Ejecutar tras carga del DOM (garantiza que el botón exista)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureThemeLabel);
  else ensureThemeLabel();
  // Reintentos tardíos para capturar renders diferidos por otros scripts
  setTimeout(ensureThemeLabel, 150);
  setTimeout(syncThemeLabels, 250);
  setTimeout(syncThemeLabels, 1000);

  // Etiqueta de fecha [data-today]
  (function paintToday(){
    const el = document.querySelector('[data-today]');
    if (!el) return;
    try {
      const d = new Date();
      const fmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(d);
      el.textContent = fmt;
    } catch (e) {}
  })();

  // ====== NAV: empaquetar items extra bajo "Más" cuando no hay espacio ======
  (function initNavPriority(){
    const nav = document.querySelector('.nav');
    if (!nav) return;
    let more = nav.querySelector('.menu-more');
    if (!more) {
      more = document.createElement('details');
      more.className = 'menu-dd menu-more';
      more.innerHTML = '<summary>Más<\/summary><ul class="menu-dd__list"><\/ul>';
      nav.appendChild(more);
    }
    const moreList = more.querySelector('.menu-dd__list');

    function pack() {
      // Mover de regreso todos los ítems previamente empaquetados
      Array.from(moreList.children).forEach(li => {
        const a = li.firstElementChild;
        if (a && a.dataset && a.dataset.refId) {
          const original = document.querySelector('[data-nav-id="'+a.dataset.refId+'"]');
          if (original) nav.insertBefore(original, more);
        }
      });

      const items = Array.from(nav.querySelectorAll(':scope > a, :scope > details'))
        .filter(el => !el.classList.contains('menu-more'));
      const navWidth = nav.clientWidth - more.offsetWidth - 24;
      let used = 0;

      for (const el of items) {
        const w = el.offsetWidth;
        if (used + w > navWidth) {
          const li = document.createElement('li');
          const id = 'n'+Math.random().toString(36).slice(2,7);
          el.dataset.navId = id;
          const text = el.tagName === 'A' ? el.textContent.trim() : el.querySelector('summary')?.textContent.trim() || 'Sección';
          const href = el.tagName === 'A' ? el.getAttribute('href') : '#';
          li.innerHTML = `<a data-ref-id="${id}" href="${href}">${text}<\/a>`;
          moreList.insertBefore(li, moreList.firstChild);
          el.remove();
        } else {
          used += w;
        }
      }
    }

    pack();
    let rafId = 0;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(pack);
    };
    window.addEventListener('resize', onResize);
  })();

  // ============ Consentimiento de cookies (tolerante) ============
  const cookieBanner = document.querySelector(".cookie");
  const cookieAccept = cookieBanner?.querySelector(".cookie__accept");
  const cookieReject = cookieBanner?.querySelector(".cookie__reject");
  if (cookieBanner && (cookieAccept || cookieReject)) {
    const KEY = "cd_cookie_consent";
    const state = localStorage.getItem(KEY);
    if (!state) cookieBanner.hidden = false;
    const setConsent = (val) => {
      localStorage.setItem(KEY, val);
      cookieBanner.hidden = true;
    };
    cookieAccept?.addEventListener('click', () => setConsent('accepted'));
    cookieReject?.addEventListener('click', () => setConsent('rejected'));
  }

  // Foco accesible para detalles de menú desplegable
  document.querySelectorAll('details.menu-dd').forEach(dd => {
    dd.addEventListener('toggle', () => {
      if (dd.open) dd.querySelector('summary')?.setAttribute('aria-expanded', 'true');
      else dd.querySelector('summary')?.setAttribute('aria-expanded', 'false');
    });
  });

  // Cerrar detalles al pulsar Escape
  (function closeOnEsc(){
    function closeAll(){
      document.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'));
    }
    document.addEventListener('keydown', (ev) => {
      if (ev.key === "Escape") closeAll();
    });
  })();

})();
