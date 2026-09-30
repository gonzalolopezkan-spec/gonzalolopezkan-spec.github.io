/* ============================================================
   cookies.js — Banner de cookies + GA4 condicional
   LetsBoxIt · RGPD + AEPD 2023 compliant
   ============================================================ */
(function () {
  'use strict';

  const STORAGE_KEY = 'letsboxit_cookies_consent';
  const GA_ID = 'G-H8DXPLPB9K';
  const VERSION = '1.0';

  /* ── Idioma según la ruta (/en/, /fr/, resto = es) ── */
  const _seg = location.pathname.split('/').filter(Boolean);
  const LANG = _seg[0] === 'en' ? 'en' : (_seg[0] === 'fr' ? 'fr' : 'es');
  const COOKIE_HREF = LANG === 'es' ? '/politica-cookies.html'
    : (LANG === 'en' ? '/en/politica-cookies.html' : '/fr/politica-cookies.html');
  const C = {
    es: {
      bannerAria: 'Aviso de cookies',
      intro: 'Usamos cookies para mejorar tu experiencia y entender cómo se usa la web. Las cookies técnicas son necesarias y siempre están activas. Puedes aceptar todo, rechazar lo opcional o configurar tus preferencias.',
      moreInfo: 'Más información en nuestra Política de Cookies',
      acceptAll: 'Aceptar todas', reject: 'Rechazar', config: 'Configurar',
      modalAria: 'Configuración de cookies', modalTitle: 'Configuración de cookies',
      modalIntro: 'Elige qué cookies aceptas. Puedes cambiar tu elección en cualquier momento desde el footer.',
      techTitle: 'Cookies técnicas',
      techDesc: 'Necesarias para el funcionamiento del sitio web. Incluyen el sistema de pago y la gestión de tu sesión.',
      always: 'Siempre',
      anaTitle: 'Cookies analíticas',
      anaDesc: 'Nos ayudan a entender cómo usas la web (Google Analytics). Datos anonimizados.',
      mktTitle: 'Cookies de marketing',
      mktDesc: 'Para medir las conversiones de Google Ads y personalizar la publicidad de nuestras campañas. Se activan solo si las aceptas.',
      save: 'Guardar preferencias', rejectAll: 'Rechazar todas'
    },
    en: {
      bannerAria: 'Cookie notice',
      intro: 'We use cookies to improve your experience and understand how the site is used. Technical cookies are necessary and always active. You can accept everything, reject the optional ones or configure your preferences.',
      moreInfo: 'More information in our Cookie Policy',
      acceptAll: 'Accept all', reject: 'Reject', config: 'Configure',
      modalAria: 'Cookie settings', modalTitle: 'Cookie settings',
      modalIntro: 'Choose which cookies you accept. You can change your choice at any time from the footer.',
      techTitle: 'Technical cookies',
      techDesc: 'Necessary for the website to work. They include the payment system and managing your session.',
      always: 'Always',
      anaTitle: 'Analytics cookies',
      anaDesc: 'They help us understand how you use the site (Google Analytics). Anonymised data.',
      mktTitle: 'Marketing cookies',
      mktDesc: 'To measure Google Ads conversions and personalise our campaign advertising. Enabled only if you accept.',
      save: 'Save preferences', rejectAll: 'Reject all'
    },
    fr: {
      bannerAria: 'Avis sur les cookies',
      intro: 'Nous utilisons des cookies pour améliorer votre expérience et comprendre comment le site est utilisé. Les cookies techniques sont nécessaires et toujours actifs. Vous pouvez tout accepter, refuser les cookies optionnels ou configurer vos préférences.',
      moreInfo: 'Plus d\'informations dans notre Politique de cookies',
      acceptAll: 'Tout accepter', reject: 'Refuser', config: 'Configurer',
      modalAria: 'Paramètres des cookies', modalTitle: 'Paramètres des cookies',
      modalIntro: 'Choisissez les cookies que vous acceptez. Vous pouvez modifier votre choix à tout moment depuis le pied de page.',
      techTitle: 'Cookies techniques',
      techDesc: 'Nécessaires au fonctionnement du site web. Ils incluent le système de paiement et la gestion de votre session.',
      always: 'Toujours',
      anaTitle: 'Cookies analytiques',
      anaDesc: 'Ils nous aident à comprendre comment vous utilisez le site (Google Analytics). Données anonymisées.',
      mktTitle: 'Cookies marketing',
      mktDesc: 'Pour mesurer les conversions Google Ads et personnaliser la publicité de nos campagnes. Activés uniquement si vous les acceptez.',
      save: 'Enregistrer les préférences', rejectAll: 'Tout refuser'
    }
  }[LANG];

  /* ── Google tag (GA4 + Google Ads) + Consent Mode v2 ──
     Cargamos el Google tag SIEMPRE, pero con el consentimiento por defecto
     DENEGADO: ninguna cookie de medición hasta que el usuario acepte. Es el
     enfoque Consent Mode v2 que recomienda Google y cumple RGPD/AEPD. */
  const ADS_ID = 'AW-18245455796';                                  // Google Ads
  window.LBI_ADS_CONVERSION = 'AW-18245455796/24ptCMu88MAcELSfjvxD'; // acción "Reserva pagada"

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
  });

  /* Traduce la elección del banner a señales de Consent Mode. */
  function applyConsent(analytics, marketing) {
    gtag('consent', 'update', {
      analytics_storage:  analytics ? 'granted' : 'denied',
      ad_storage:         marketing ? 'granted' : 'denied',
      ad_user_data:       marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied',
    });
  }

  /* Carga gtag.js una sola vez (GA4 + Google Ads bajo el mismo tag). */
  function loadGoogleTag() {
    if (window.gtagLoaded) return;
    window.gtagLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ADS_ID;
    document.head.appendChild(script);

    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });  // Google Analytics 4
    gtag('config', ADS_ID);                          // Google Ads
  }

  /* ── Guardar consentimiento ── */
  function saveConsent(analytics, marketing) {
    const obj = {
      technical: true,
      analytics: !!analytics,
      marketing: !!marketing,
      timestamp: new Date().toISOString(),
      version: VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    return obj;
  }

  /* ── Leer consentimiento ── */
  function getConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj.version !== VERSION) return null; // re-ask on version bump
      return obj;
    } catch (e) {
      return null;
    }
  }

  /* ── Al cargar: aplica el consentimiento previo (si lo hay) y carga el tag ── */
  const existing = getConsent();
  if (existing) applyConsent(existing.analytics, existing.marketing);
  loadGoogleTag();   // siempre; Consent Mode v2 gestiona la privacidad

  /* ── Si ya hay consentimiento guardado, no mostrar banner ── */
  if (existing) return;

  /* ── Crear HTML ── */
  const bannerHTML = `
  <div class="cookie-banner" id="cookieBanner" role="dialog" aria-label="${C.bannerAria}" aria-live="polite">
    <div class="cookie-banner-text">
      <p>${C.intro}</p>
      <p><a href="${COOKIE_HREF}">${C.moreInfo}</a></p>
    </div>
    <div class="cookie-banner-btns">
      <button class="cookie-btn-accept" id="cookieBtnAccept">${C.acceptAll}</button>
      <button class="cookie-btn-reject" id="cookieBtnReject">${C.reject}</button>
      <button class="cookie-btn-config" id="cookieBtnConfig">${C.config}</button>
    </div>
  </div>

  <div class="cookie-modal-overlay" id="cookieModalOverlay" role="dialog" aria-modal="true" aria-label="${C.modalAria}">
    <div class="cookie-modal">
      <h2>${C.modalTitle}</h2>
      <p>${C.modalIntro}</p>

      <div class="cookie-cat">
        <div class="cookie-cat-info">
          <strong>${C.techTitle}</strong>
          <span>${C.techDesc}</span>
        </div>
        <div class="cookie-toggle">
          <input type="checkbox" id="toggleTechnical" checked disabled>
          <label for="toggleTechnical"></label>
          <div class="cookie-always">${C.always}</div>
        </div>
      </div>

      <div class="cookie-cat">
        <div class="cookie-cat-info">
          <strong>${C.anaTitle}</strong>
          <span>${C.anaDesc}</span>
        </div>
        <div class="cookie-toggle">
          <input type="checkbox" id="toggleAnalytics">
          <label for="toggleAnalytics"></label>
        </div>
      </div>

      <div class="cookie-cat">
        <div class="cookie-cat-info">
          <strong>${C.mktTitle}</strong>
          <span>${C.mktDesc}</span>
        </div>
        <div class="cookie-toggle">
          <input type="checkbox" id="toggleMarketing">
          <label for="toggleMarketing"></label>
        </div>
      </div>

      <div class="cookie-modal-footer">
        <button class="cookie-btn-save" id="cookieBtnSave">${C.save}</button>
        <button class="cookie-btn-accept" id="cookieBtnAcceptAll2">${C.acceptAll}</button>
        <button class="cookie-btn-reject-all" id="cookieBtnRejectAll2">${C.rejectAll}</button>
      </div>
    </div>
  </div>`;

  // Mount
  const wrapper = document.createElement('div');
  wrapper.innerHTML = bannerHTML;
  document.body.appendChild(wrapper);

  const banner = document.getElementById('cookieBanner');
  const overlay = document.getElementById('cookieModalOverlay');

  /* ── Mostrar banner con delay ── */
  requestAnimationFrame(() => {
    setTimeout(() => banner.classList.add('show'), 300);
  });

  function hideBanner() {
    banner.classList.remove('show');
    setTimeout(() => { try { banner.remove(); } catch(e){} }, 420);
  }
  function hideModal() {
    overlay.classList.remove('show');
  }

  /* ── Aceptar todas ── */
  function acceptAll() {
    saveConsent(true, true);
    applyConsent(true, true);
    hideBanner();
    hideModal();
  }

  /* ── Rechazar opcionales ── */
  function rejectAll() {
    saveConsent(false, false);
    applyConsent(false, false);
    hideBanner();
    hideModal();
  }

  /* ── Guardar preferencias ── */
  function savePrefs() {
    const analytics = document.getElementById('toggleAnalytics').checked;
    const marketing = document.getElementById('toggleMarketing').checked;
    saveConsent(analytics, marketing);
    applyConsent(analytics, marketing);
    hideBanner();
    hideModal();
  }

  /* ── Abrir modal ── */
  function openModal() {
    overlay.classList.add('show');
  }

  /* ── Listeners ── */
  document.getElementById('cookieBtnAccept').addEventListener('click', acceptAll);
  document.getElementById('cookieBtnReject').addEventListener('click', rejectAll);
  document.getElementById('cookieBtnConfig').addEventListener('click', openModal);
  document.getElementById('cookieBtnSave').addEventListener('click', savePrefs);
  document.getElementById('cookieBtnAcceptAll2').addEventListener('click', acceptAll);
  document.getElementById('cookieBtnRejectAll2').addEventListener('click', rejectAll);

  // Close modal on overlay click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) hideModal();
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hideModal();
  });

})();

/* ── Configurar cookies (llamado desde el footer) ── */
window.lbiResetCookies = function () {
  localStorage.removeItem('letsboxit_cookies_consent');
  location.reload();
};

/* ============================================================
   GA4 Analytics Events — solo si gtag está disponible
   ============================================================ */

/* Evento: reservar_click */
function trackReservarClick(origen) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'reservar_click', { origen: origen });
  }
}

/* Evento: whatsapp_click */
function trackWhatsappClick(origen) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'whatsapp_click', { origen: origen });
  }
}

/* Evento: formulario_completado */
function trackFormularioCompletado(canalAtribucion, numeroCajas) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'formulario_completado', {
      canal_atribucion: canalAtribucion || '',
      numero_cajas: numeroCajas || 0,
    });
  }
}

/* ── Attach event listeners after DOM is ready ── */
document.addEventListener('DOMContentLoaded', function () {

  /* Reservar CTAs — identifica botones por texto o clase */
  document.querySelectorAll('a[href*="reserva"], button').forEach(function (el) {
    const text = (el.textContent || '').trim().toLowerCase();
    if (
      text.includes('reservar') ||
      text.includes('reserva') ||
      el.classList.contains('btn-reservar')
    ) {
      el.addEventListener('click', function () {
        // Determine origin from page + position
        const page = location.pathname.split('/').pop() || 'index.html';
        let origen = page.replace('.html', '');
        if (el.closest('nav')) origen = 'menu_principal';
        else if (el.closest('.hero') || el.closest('[data-screen-label*="Hero"]')) origen = origen + '_hero';
        else if (el.closest('.cta-banner') || el.closest('[data-screen-label*="CTA"]')) origen = origen + '_cta';
        trackReservarClick(origen);
      });
    }
  });

  /* WhatsApp links */
  document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(function (el) {
    el.addEventListener('click', function () {
      const page = location.pathname.split('/').pop() || 'index.html';
      let origen = page.replace('.html', '');
      if (el.closest('nav')) origen = 'menu_principal';
      else if (el.closest('footer')) origen = 'footer';
      trackWhatsappClick(origen);
    });
  });

  /* Formulario de reserva */
  const reservaForm = document.getElementById('reservaForm');
  if (reservaForm) {
    reservaForm.addEventListener('submit', function () {
      const canal = (reservaForm.querySelector('[name="origen"]') || {}).value || '';
      const cajas = parseInt((reservaForm.querySelector('[name="cajas"]') || {}).value) || 0;
      trackFormularioCompletado(canal, cajas);
    });
  }
});
