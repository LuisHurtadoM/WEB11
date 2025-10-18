// Centro de Día — main.js (FIX 2025-09-02, nav autoclose exclusivo)
(() => {
  "use strict";
  const STORAGE_THEME = "cd_theme";
  const html = document.documentElement;

  function syncThemeLabels() {
    const isDark = html.classList.contains('theme-dark') || html.classList.contains('dark');
    document.querySelectorAll('[data-theme-label]').forEach(l => {
      try { l.textContent = isDark ? 'claro' : 'oscuro'; } catch (e) {}
    });
  }

  function applyTheme(mode) {
    const m = (mode === "theme-dark" || mode === "dark") ? "theme-dark" : "theme-light";
    html.classList.remove("theme-light", "theme-dark", "dark", "light");
    html.classList.add(m);
    if (m === 'theme-dark') html.classList.add('dark');
    try { localStorage.setItem(STORAGE_THEME, m); } catch (e) {}
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      try {
        btn.setAttribute("aria-pressed", m === "theme-dark" ? "true" : "false");
        btn.setAttribute("title", m === "theme-dark" ? "Cambiar a claro" : "Cambiar a oscuro");
        const label = btn.querySelector('[data-theme-label]');
        if (label) label.textContent = m === "theme-dark" ? "claro" : "oscuro";
      } catch (e) {}
    });
    syncThemeLabels();
  }

  let initial = "theme-light";
  try {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved === "theme-dark" || saved === "theme-light") initial = saved;
    else if (html.classList.contains('dark') || html.classList.contains('theme-dark')) initial = 'theme-dark';
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) initial = "theme-dark";
  } catch (e) {}
  applyTheme(initial);

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

  // Auto-close exclusivo de menús desplegables
  document.addEventListener("click", (ev) => {
    const clickedMenu = ev.target.closest('details.menu-dd');
    document.querySelectorAll('details.menu-dd[open]').forEach(dd => {
      if (dd !== clickedMenu) {
        dd.removeAttribute('open');
      }
    });
    // Si clic fuera de cualquier menú abierto → cerrar todos
    if (!clickedMenu) {
      document.querySelectorAll('details.menu-dd[open]').forEach(dd => dd.removeAttribute('open'));
    }
  });

  (function watchForThemeButtons(){
    const obs = new MutationObserver(() => {
      clearTimeout(window.__cd_sync_theme_label_timeout);
      window.__cd_sync_theme_label_timeout = setTimeout(() => {
        ensureThemeLabel();
        syncThemeLabels();
      }, 30);
    });
    try {
      obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
    } catch (e) {}
  })();

  function ensureThemeLabel() {
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      try {
        const existing = btn.querySelector('[data-theme-label]');
        if (!existing) {
          btn.innerHTML = '🌓 <span data-theme-label></span>';
        }
      } catch (e) {}
    });
    syncThemeLabels();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureThemeLabel);
  else ensureThemeLabel();
  setTimeout(ensureThemeLabel, 150);
  setTimeout(syncThemeLabels, 250);
  setTimeout(syncThemeLabels, 1000);

  (function paintToday(){
    const el = document.querySelector('[data-today]');
    if (!el) return;
    try {
      const d = new Date();
      const fmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(d);
      el.textContent = fmt;
    } catch (e) {}
  })();

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

  document.querySelectorAll('details.menu-dd').forEach(dd => {
    dd.addEventListener('toggle', () => {
      if (dd.open) dd.querySelector('summary')?.setAttribute('aria-expanded', 'true');
      else dd.querySelector('summary')?.setAttribute('aria-expanded', 'false');
    });
  });

  (function closeOnEsc(){
    function closeAll(){
      document.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'));
    }
    document.addEventListener('keydown', (ev) => {
      if (ev.key === "Escape") closeAll();
    });
  })();
})();
