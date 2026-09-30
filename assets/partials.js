// Shared nav + footer markup, injected into a placeholder div on each page.
// Keeps the multi-page site DRY without a build step.
// Language-aware: detects es / en / fr from the URL path and renders the
// matching labels, the right "Guides" link and a ES·EN·FR language selector.
//
// v2 (sistema "La etiqueta"): marcado con clases lb-nav*/lb-footer*, estilos
// en assets/lb-chrome.css. Ver docs/superpowers/specs y scratchpad/brief/06-sistema-v2.md.

(function () {
  // Oferta de reserva: fecha límite única para toda la web.
  // Si hoy > fin, la urgencia se oculta sola (body.oferta-caducada + styles.css).
  var LBI_OFERTA = { fin: '2026-07-31' };

  // ---- Language detection from path (/en/..., /fr/..., else es) ----
  const seg = location.pathname.split('/').filter(Boolean);
  let lang = 'es';
  if (seg[0] === 'en') lang = 'en';
  else if (seg[0] === 'fr') lang = 'fr';

  // Base filename of the current page, without the language folder (ruta
  // completa relativa, no solo el último segmento: si no, páginas ES en
  // subcarpetas como guias/index.html se confundían con la home).
  const rawFile = (lang === 'es') ? (seg.join('/') || '') : (seg.slice(1).join('/') || '');
  const isHome = (rawFile === '' || rawFile === 'index.html');

  // Primer segmento de la página dentro de su propio idioma (p.ej. "guias",
  // "guides", "residencias"). Se usa para el arreglo del selector de idioma.
  const relSeg = (lang === 'es') ? seg : seg.slice(1);
  const rawSeg0 = relSeg[0] || '';
  const EDITORIAL_DIRS = new Set(['guias', 'guides', 'residencias']);

  // Paths sin equivalente traducido — el selector de idioma redirige a la
  // home del idioma para no dejar links rotos hasta que exista la traducción.
  const NO_FR = new Set(['mudanzas.html', 'mudanzas-estudiantes.html', 'para-residencias.html']);
  const NO_EN = new Set(['mudanzas-estudiantes.html', 'para-residencias.html']);

  // Equivalent URL of the current page in a given language (absolute).
  // Orden de resolución (arregla los 404 del selector en guías/residencias):
  //   1) si la página tiene <link rel="alternate" hreflang="l"> en el <head>,
  //      se usa esa URL (la fuente más fiable, la ponen las propias páginas).
  //   2) si no hay alternate y la página vive en una carpeta editorial
  //      (guias/, residencias/, en/guides/, en/residencias/, fr/guides/) sin
  //      traducción garantizada, cae a la home de ese idioma.
  //   3) si no, la lógica de siempre (NO_FR/NO_EN, o mismo path en el idioma).
  function urlFor(l) {
    const base = (l === 'es') ? '/' : '/' + l + '/';
    if (isHome) return base;

    const alt = document.querySelector('link[rel="alternate"][hreflang="' + l + '"]');
    if (alt) {
      const href = alt.getAttribute('href');
      if (href) return href;
    }

    if (EDITORIAL_DIRS.has(rawSeg0)) return base;

    if (l === 'fr' && NO_FR.has(rawFile)) return base;
    if (l === 'en' && NO_EN.has(rawFile)) return base;
    return base + rawFile;
  }

  // ---- Translations ----
  const T = {
    es: {
      brandAria: 'LetsBoxIt — inicio',
      home: 'Inicio', how: 'Cómo funciona', pricing: 'Precios',
      rates: 'Tarifas', calc: 'Calculadora', parents: 'Familias',
      residencias: 'Residencias', paraResidencias: 'Para residencias',
      guides: 'Guías', guidesHref: '/guias/', book: 'Reservar con 20 €', bookNow: 'Reservar ahora →',
      moving: 'Mudanzas',
      ofertaFecha: 'hasta el 31 de julio',
      menu: 'Menú', menuDialog: 'Menú de navegación', wa: 'WhatsApp',
      footTagline: 'Almacenaje de verano para estudiantes en Madrid. Lo hacemos estudiantes.',
      service: 'Servicio', forYou: 'Para ti', support: 'Soporte', legal: 'Legal',
      faq: 'Preguntas frecuentes', maps: '📍 Encuéntranos en Google Maps',
      avisoLegal: 'Aviso legal', privacidad: 'Política de privacidad',
      cookies: 'Política de cookies', condiciones: 'Condiciones de uso',
      cfgCookies: 'Configurar cookies',
      copySuffix: 'Un proyecto KAN',
      madeWith: 'Madrid · Hecho con cariño por Gon &amp; Jose',
      langAria: 'Idioma'
    },
    en: {
      brandAria: 'LetsBoxIt — home',
      home: 'Home', how: 'How it works', pricing: 'Pricing',
      rates: 'Rates', calc: 'Calculator', parents: 'Parents',
      residencias: 'Residencias', paraResidencias: 'For residences',
      guides: 'Guides', guidesHref: '/en/guides/', book: 'Book', bookNow: 'Book now →',
      moving: 'Moving',
      ofertaFecha: 'until 31 July',
      menu: 'Menu', menuDialog: 'Navigation menu', wa: 'WhatsApp',
      footTagline: 'Summer storage for students in Madrid. We’re students too.',
      service: 'Service', forYou: 'For you', support: 'Support', legal: 'Legal',
      faq: 'Frequently asked questions', maps: '📍 Find us on Google Maps',
      avisoLegal: 'Legal notice', privacidad: 'Privacy policy',
      cookies: 'Cookie policy', condiciones: 'Terms of use',
      cfgCookies: 'Cookie settings',
      copySuffix: 'A KAN project',
      madeWith: 'Madrid · Made with care by Gon &amp; Jose',
      langAria: 'Language'
    },
    fr: {
      brandAria: 'LetsBoxIt — accueil',
      home: 'Accueil', how: 'Comment ça marche', pricing: 'Tarifs',
      rates: 'Tarifs', calc: 'Calculateur', parents: 'Parents',
      residencias: 'Résidences', paraResidencias: 'Pour les résidences',
      guides: 'Guides', guidesHref: '/fr/guides/', book: 'Réserver', bookNow: 'Réserver →',
      moving: 'Déménagement',
      ofertaFecha: 'jusqu\'au 31 juillet',
      menu: 'Menu', menuDialog: 'Menu de navigation', wa: 'WhatsApp',
      footTagline: 'Stockage estival pour étudiants à Madrid. Ce sont des étudiants qui s\'en occupent.',
      service: 'Service', forYou: 'Pour vous', support: 'Support', legal: 'Légal',
      faq: 'Questions fréquentes', maps: '📍 Trouvez-nous sur Google Maps',
      avisoLegal: 'Mentions légales', privacidad: 'Politique de confidentialité',
      cookies: 'Politique de cookies', condiciones: 'Conditions d\'utilisation',
      cfgCookies: 'Paramètres des cookies',
      copySuffix: 'Un projet KAN',
      madeWith: 'Madrid · Fait avec soin par Gon &amp; Jose',
      langAria: 'Langue'
    }
  }[lang];

  const BRAND_SVG = `<span class="lb-brand-mark" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5v-9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M3 7.5L12 12m0 0l9-4.5M12 12v9" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
        </span>`;

  // Language selector (text ES · EN · FR), links to the equivalent page.
  function langSwitch(extraClass) {
    function opt(l, label) {
      const active = (l === lang) ? ' active' : '';
      return `<a href="${urlFor(l)}" class="lb-lang-opt${active}" data-lang="${l}" hreflang="${l}"${active ? ' aria-current="true"' : ''}>${label}</a>`;
    }
    return `<div class="lb-lang-switch ${extraClass || ''}" role="group" aria-label="${T.langAria}">`
      + opt('es', 'ES') + `<span class="lb-lang-sep" aria-hidden="true">·</span>`
      + opt('en', 'EN') + `<span class="lb-lang-sep" aria-hidden="true">·</span>`
      + opt('fr', 'FR') + `</div>`;
  }

  // Base absoluta por idioma. Con esto los links de nav funcionan desde
  // cualquier profundidad (raíz, /guias/, /guias/subcarpeta/, /en/, /fr/…).
  const B = (lang === 'es') ? '/' : '/' + lang + '/';

  // "Mudanzas" ya existe en ES y EN (tanda 4 del playbook SEO). FR sigue pendiente:
  // cuando exista /fr/mudanzas.html, añadir 'fr' aquí y su traducción a T.fr.
  const NAV_MUDANZAS = (lang === 'es' || lang === 'en') ? `<li><a href="${B}mudanzas.html">${T.moving}</a></li>` : '';
  const MOB_MUDANZAS = (lang === 'es' || lang === 'en') ? `<a href="${B}mudanzas.html">${T.moving}</a>` : '';

  // "Residencias" — página listado /residencias/, solo existe en ES por ahora.
  const NAV_RESIDENCIAS = (lang === 'es') ? `<li><a href="/residencias/">${T.residencias}</a></li>` : '';
  const MOB_RESIDENCIAS = (lang === 'es') ? `<a href="/residencias/">${T.residencias}</a>` : '';

  const NAV = `
  <nav class="lb-nav" id="lbNav">
    <div class="lb-container lb-nav-inner">
      <a href="${B}" class="lb-brand" aria-label="${T.brandAria}">
        ${BRAND_SVG}
        LetsBoxIt
      </a>
      <ul class="lb-nav-links" role="menubar">
        <li><a href="${B}como-funciona.html">${T.how}</a></li>
        <li class="lb-nav-dropdown" id="navDropdownPrecios">
          <span class="lb-dropdown-trigger">
            <a href="${B}precios.html">${T.pricing}</a>
            <span class="lb-dropdown-arrow" aria-hidden="true">▾</span>
          </span>
          <ul class="lb-dropdown-menu" role="menu">
            <li><a href="${B}precios.html" role="menuitem">${T.rates}</a></li>
            <li><a href="${B}calculadora.html" role="menuitem">${T.calc}</a></li>
          </ul>
        </li>
        <li><a href="${B}para-padres.html">${T.parents}</a></li>
        ${NAV_RESIDENCIAS}
        ${NAV_MUDANZAS}
        <li><a href="${T.guidesHref}">${T.guides}</a></li>
      </ul>
      <div class="lb-nav-cta">
        ${langSwitch('lb-lang-switch-desktop')}
        <a href="https://wa.me/34664530600" class="lb-btn lb-btn--ghost" aria-label="WhatsApp" title="WhatsApp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 21l1.65-4.5A8.5 8.5 0 1 1 7.5 19.35L3 21z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
          <span class="lb-btn-label">${T.wa}</span>
        </a>
        <a href="${B}reserva.html" class="lb-btn lb-btn--primary">${T.book}</a>
      </div>
      <button class="lb-nav-hamburger" id="navHamburger" aria-label="${T.menu}" aria-expanded="false" aria-controls="navMobileMenu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div class="lb-nav-mobile-menu" id="navMobileMenu" role="dialog" aria-modal="true" aria-label="${T.menuDialog}">
    <a href="${B}como-funciona.html">${T.how}</a>
    <div class="lb-nav-mobile-accordion" id="navMobileAccordion">
      <button class="lb-nav-mobile-accordion-btn" id="navMobileAccordionBtn" aria-expanded="false" aria-controls="navMobileSubitems">
        ${T.pricing}
        <span class="lb-dropdown-arrow" aria-hidden="true">▾</span>
      </button>
      <div class="lb-nav-mobile-subitems" id="navMobileSubitems">
        <a href="${B}precios.html">${T.rates}</a>
        <a href="${B}calculadora.html">${T.calc}</a>
      </div>
    </div>
    <a href="${B}para-padres.html">${T.parents}</a>
    ${MOB_RESIDENCIAS}
    ${MOB_MUDANZAS}
    <a href="${T.guidesHref}">${T.guides}</a>
    <div class="lb-nav-mobile-cta">
      <a href="https://wa.me/34664530600" class="lb-btn lb-btn--ghost">${T.wa}</a>
      <a href="${B}reserva.html" class="lb-btn lb-btn--primary">${T.book}</a>
    </div>
    ${langSwitch('lb-lang-switch-mobile')}
  </div>`;

  const FOOTER = `
  <footer class="lb-footer">
    <div class="lb-footer-tape" aria-hidden="true"></div>
    <div class="lb-container">
      <div class="lb-footer-grid">
        <div class="lb-footer-brand">
          <a href="${B}" class="lb-brand" aria-label="${T.brandAria}">
            ${BRAND_SVG}
            LetsBoxIt
          </a>
          <p>${T.footTagline}</p>
          <ul class="lb-footer-contact">
            <li><a href="https://wa.me/34664530600">WhatsApp</a></li>
            <li><a href="mailto:hola@letsboxit.es">hola@letsboxit.es</a></li>
          </ul>
        </div>
        <div class="lb-footer-col">
          <h6>${T.service}</h6>
          <ul>
            <li><a href="${B}como-funciona.html">${T.how}</a></li>
            <li><a href="${B}precios.html">${T.pricing}</a></li>
            <li><a href="${B}calculadora.html">${T.calc}</a></li>
            ${NAV_MUDANZAS}
            ${NAV_RESIDENCIAS}
          </ul>
        </div>
        <div class="lb-footer-col">
          <h6>${T.forYou}</h6>
          <ul>
            <li><a href="${B}para-padres.html">${T.parents}</a></li>
            ${lang === 'es' ? `<li><a href="/para-residencias.html">${T.paraResidencias}</a></li>` : ''}
            <li><a href="${T.guidesHref}">${T.guides}</a></li>
            <li><a href="${B}como-funciona.html#faq">${T.faq}</a></li>
          </ul>
        </div>
        <div class="lb-footer-col">
          <h6>${T.legal}</h6>
          <ul>
            <li><a href="${B}aviso-legal.html">${T.avisoLegal}</a></li>
            <li><a href="${B}politica-privacidad.html">${T.privacidad}</a></li>
            <li><a href="${B}politica-cookies.html">${T.cookies}</a></li>
            <li><a href="${B}condiciones-de-uso.html">${T.condiciones}</a></li>
            <li><a href="#" class="lb-footer-cookie-cfg" onclick="window.lbiResetCookies && window.lbiResetCookies(); return false;">${T.cfgCookies}</a></li>
          </ul>
        </div>
      </div>
      <div class="lb-footer-bottom">
        <span id="lbFooterCopy"></span>
        <span class="lb-muted">${T.madeWith}</span>
      </div>
    </div>
  </footer>`;

  const navMount = document.querySelector('[data-nav]');
  const footMount = document.querySelector('[data-footer]');
  if (navMount) navMount.outerHTML = NAV;
  if (footMount) footMount.outerHTML = FOOTER;

  // Oferta de reserva: pinta la fecha límite y apaga la urgencia si ya caducó.
  if (T.ofertaFecha) {
    document.querySelectorAll('[data-oferta-fecha]').forEach((el) => {
      el.textContent = T.ofertaFecha;
    });
  }
  const hoy = new Date();
  const hoyISO = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  if (hoyISO > LBI_OFERTA.fin) document.body.classList.add('oferta-caducada');

  // Copyright del footer con el año calculado (nunca hardcodeado).
  const copyEl = document.getElementById('lbFooterCopy');
  if (copyEl) copyEl.textContent = '© ' + hoy.getFullYear() + ' LetsBoxIt · ' + T.copySuffix;

  // Remember the user's language choice (no auto-redirect).
  document.querySelectorAll('.lb-lang-switch .lb-lang-opt').forEach((a) => {
    a.addEventListener('click', () => {
      try { localStorage.setItem('lbi_lang', a.getAttribute('data-lang')); } catch (e) {}
    });
  });

  // Mark active link after injection. Compara por el path resuelto de cada
  // <a> (funciona tanto con href relativo antiguo como con href absoluto).
  const here = location.pathname.replace(/\/$/, '/index.html');
  document.querySelectorAll('.lb-nav-links a, .lb-dropdown-menu a, .lb-nav-mobile-subitems a').forEach((a) => {
    try {
      const p = new URL(a.href, location.origin).pathname.replace(/\/$/, '/index.html');
      if (p === here) a.classList.add('active');
    } catch (e) {}
  });
  // Mark dropdown trigger active when a subpage is active
  if (/\/(precios|calculadora)\.html$/.test(here)) {
    const trigger = document.querySelector('.lb-dropdown-trigger');
    if (trigger) trigger.classList.add('active');
  }

  // Hamburger menu toggle
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobileMenu');

  function closeMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close on link click (excluding accordion toggle)
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMobileMenu);
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        closeDesktopDropdown();
      }
    });
  }

  // Mobile accordion for Precios
  const accordionBtn = document.getElementById('navMobileAccordionBtn');
  const accordionSubitems = document.getElementById('navMobileSubitems');
  if (accordionBtn && accordionSubitems) {
    accordionBtn.addEventListener('click', () => {
      const isOpen = accordionBtn.classList.toggle('accordion-open');
      accordionSubitems.classList.toggle('accordion-open', isOpen);
      accordionBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Desktop dropdown: close on click outside and Escape
  const desktopDropdown = document.getElementById('navDropdownPrecios');

  function closeDesktopDropdown() {
    if (desktopDropdown) desktopDropdown.classList.remove('open');
  }

  if (desktopDropdown) {
    // Toggle on click of trigger (for keyboard/touch users on desktop)
    const trigger = desktopDropdown.querySelector('.lb-dropdown-trigger');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        // If the click is directly on the <a> inside, let it navigate
        if (e.target.tagName === 'A') return;
        e.preventDefault();
        desktopDropdown.classList.toggle('open');
      });
    }
    // Close when a subitem is clicked
    desktopDropdown.querySelectorAll('.lb-dropdown-menu a').forEach(a => {
      a.addEventListener('click', closeDesktopDropdown);
    });
    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!desktopDropdown.contains(e.target)) closeDesktopDropdown();
    });
  }

  // Cabecera con borde/opacidad al hacer scroll (estilo prototipo A).
  const lbNav = document.getElementById('lbNav');
  if (lbNav) {
    const onScroll = () => {
      lbNav.classList.toggle('lb-nav--scrolled', window.scrollY > 4);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
