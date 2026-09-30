// LetsBoxIt — shared site script

// Marca <html> en cuanto site.js corre. lb-chrome.css usa esta clase para
// que los .reveal/.reveal-stagger/.reveal-on-scroll/.lb-reveal empiecen
// visibles si este script no llega a cargar (antes: opacity:0 fijo en
// styles.css sin red de seguridad — contenido invisible si fallaba el JS).
document.documentElement.classList.add('lb-js');

// Sistema único de aparición en scroll — cubre los sistemas antiguos
// (.reveal / .reveal-stagger / .reveal-on-scroll) y el nuevo (.lb-reveal).
// Reglas:
//   1) lo que ya está en pantalla al cargar se marca visible al instante
//      (sin esperar a que entre en el viewport).
//   2) el resto se observa con IntersectionObserver.
//   3) red de seguridad: a los 2500ms se revela todo lo que quede, por si
//      el observer no llegó a disparar (o no existe).
(function () {
  const SELECTOR = '.reveal, .reveal-stagger, .reveal-on-scroll, .lb-reveal';
  const els = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
  if (!els.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealClassFor(el) {
    if (el.classList.contains('reveal-on-scroll')) return 'revealed';
    // .is-in: la clase que espera assets/styles.css (única fuente de verdad
    // del sistema .lb-reveal — ver la nota en assets/lb-chrome.css). Antes
    // era 'is-visible', una clase que ya nadie leía tras quitar el CSS
    // duplicado de lb-chrome.css.
    if (el.classList.contains('lb-reveal')) return 'is-in';
    return 'in'; // .reveal / .reveal-stagger
  }

  function markVisible(el, allowStagger) {
    const cls = revealClassFor(el);
    if (el.classList.contains(cls)) return;
    // El sistema .reveal-on-scroll soporta data-reveal-delay (ms) para
    // cascada; se respeta solo cuando el elemento entra por scroll, no en
    // la revelación instantánea inicial ni en la red de seguridad.
    if (allowStagger && el.classList.contains('reveal-on-scroll') && el.dataset.revealDelay) {
      const delay = parseInt(el.dataset.revealDelay, 10) || 0;
      setTimeout(() => el.classList.add(cls), delay);
    } else {
      el.classList.add(cls);
    }
  }

  function inViewport(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh && r.bottom > 0;
  }

  const pending = [];
  els.forEach((el) => {
    if (prefersReduced || inViewport(el)) {
      markVisible(el, false);
    } else {
      pending.push(el);
    }
  });

  if (pending.length && !prefersReduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          markVisible(entry.target, true);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    pending.forEach((el) => io.observe(el));
  } else {
    pending.forEach((el) => markVisible(el, false));
  }

  // Red de seguridad.
  setTimeout(() => { els.forEach((el) => markVisible(el, false)); }, 2500);
})();

// Nota: las IIFEs de "marcar nav activo" y "hamburguesa" que vivían aquí se
// han eliminado — eran código muerto en la práctica (corrían antes de que
// partials.js inyectara el <nav>, así que sus getElementById/querySelector
// siempre devolvían null). Ese comportamiento real lo cubre partials.js.

// Meta Pixel — Contact en clicks de enlaces WhatsApp
// Delegacion global para capturar tambien los inyectados por partials.js
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
  if (!a) return;
  var href = a.getAttribute('href') || '';
  if (/(?:^|\/\/)(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href)) {
    if (typeof fbq === 'function') fbq('track', 'Contact');
  }
}, true);
