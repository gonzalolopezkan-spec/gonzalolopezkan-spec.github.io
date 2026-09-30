/*!
 * LetsBoxIt v2 — assets/lb-ui.js
 * Comportamientos pequeños de los componentes v2. Nada aquí es imprescindible
 * para ver el contenido: todo lo visual crítico ya está pintado en el HTML/CSS
 * sin JS (ver el sistema .lb-reveal en assets/styles.css).
 *
 * 1) Marca <html class="lb-js"> (y "lb-reduced-motion" si aplica) para que el
 *    CSS sepa que puede degradar a "oculto hasta entrar en pantalla".
 * 2) Animación orquestada de la etiqueta del hero (.lb-label / .lb-stamp).
 * 3) .lb-tape-band ya se pausa en hover/focus solo con CSS (:hover/:focus-within);
 *    aquí solo garantizamos que el teclado puede detenerla (tabindex) si el
 *    marcado no lo trae ya.
 * 4) Copiar enlace: cualquier [data-lb-copy] copia data-lb-copy (o el href)
 *    al portapapeles y muestra "Copiado" un instante.
 *
 * NOTA 2026-09: este fichero observaba [.lb-reveal] con su propio
 * IntersectionObserver y añadía .is-in — duplicado del que ya corre en
 * assets/site.js (que cubre .reveal/.reveal-stagger/.reveal-on-scroll Y
 * .lb-reveal). Dos observers sobre los mismos elementos competían en modo
 * carrera y a veces ninguno de los dos llegaba a marcar .is-in a tiempo,
 * dejando bloques invisibles (p.ej. el checklist de precios.html). Se quita
 * de aquí: site.js es ahora la única fuente que toca .lb-reveal, y se carga
 * en todas las páginas que también cargan lb-ui.js.
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('lb-js');
  if (reducedMotion) document.documentElement.classList.add('lb-reduced-motion');

  function heroLabelIntro() {
    if (reducedMotion) return;
    var label = document.querySelector('[data-lb-hero-label]');
    var stamp = document.querySelector('[data-lb-hero-stamp]');
    if (!label) return;

    label.classList.add('lb-pre-anim');
    if (stamp) stamp.classList.add('lb-pre-anim');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        label.classList.remove('lb-pre-anim');
        if (stamp) setTimeout(function () { stamp.classList.remove('lb-pre-anim'); }, 620);
      });
    });
  }

  function tapeBandKeyboardPause() {
    document.querySelectorAll('.lb-tape-band').forEach(function (band) {
      if (!band.hasAttribute('tabindex')) band.setAttribute('tabindex', '0');
    });
  }

  function copyLinks() {
    document.querySelectorAll('[data-lb-copy]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var value = btn.getAttribute('data-lb-copy') || btn.getAttribute('href') || '';
        var restore = btn.textContent;
        function done(ok) {
          btn.textContent = ok ? (btn.getAttribute('data-lb-copy-ok') || 'Copiado') : restore;
          setTimeout(function () { btn.textContent = restore; }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(function () { done(true); }, function () { done(false); });
        } else {
          try {
            var ta = document.createElement('textarea');
            ta.value = value;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            done(true);
          } catch (err) { done(false); }
        }
      });
    });
  }

  function init() {
    heroLabelIntro();
    tapeBandKeyboardPause();
    copyLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
