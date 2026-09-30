/*!
 * LetsBoxIt v2 — assets/lb-planb.js
 * Comparador "plan B" (coche de los padres) por ciudad. Se engancha a
 * CUALQUIER [data-lb-planb].
 *
 * Datos: Estimación LetsBoxIt, sept-2026, doc "Competencia indirecta",
 * pestaña Padres. Precio LetsBoxIt de referencia: 276 € (7 cajas + mini
 * nevera, el ejemplo del hero). Veredicto = coche − 276, redondeado a
 * decenas. Es la ÚNICA fórmula válida: nunca decir "ahorráis" cuando el
 * coche es más barato (error ya cometido y corregido en el prototipo B).
 *
 * Markup mínimo esperado dentro de [data-lb-planb]:
 *   [data-lb-planb-city]        → botones-chip, uno por ciudad, con
 *                                  data-city="valencia" y aria-pressed
 *   [data-lb-planb-car-amount]  → "≈ 194 €"
 *   [data-lb-planb-car-hours]   → "14 h al volante"
 *   [data-lb-planb-car-days]    → "2 días de trabajo" (se oculta si 0)
 *   [data-lb-planb-verdict]     → región con aria-live="polite"
 *
 * Estado inicial: Valencia seleccionada (el caso más frecuente y el más
 * honesto: el coche gana en dinero). Si el HTML marca otra ciudad con
 * aria-pressed="true", se respeta esa en su lugar.
 */
(function () {
  'use strict';

  // Fuente: Estimación LetsBoxIt, sept-2026, doc Competencia indirecta, pestaña Padres.
  var CITIES = {
    cuenca: { car: 93, hours: 8, days: 0 },
    valencia: { car: 194, hours: 14, days: 2 },
    bilbao: { car: 225, hours: 16, days: 2 }, // rango real 216-233 €; se muestra el punto medio
    sevilla: { car: 287, hours: 21, days: 4 },
    coruna: { car: 387, hours: 22, days: 4 }
  };
  var LBX_PRICE = 276;
  var DEFAULT_CITY = 'valencia';

  var TEXT = {
    es: {
      carAmount: function (n) { return '≈ ' + n + ' €'; },
      carHours: function (h) { return h + ' h al volante'; },
      carDays: function (d) { return d + (d === 1 ? ' día de trabajo' : ' días de trabajo'); },
      cheaper: function (diff, hours, daysClause) {
        return 'En dinero, el coche sale unos <strong>' + diff + ' €</strong> más barato. Lo que os ahorráis con nosotros son <strong>' + hours + ' horas</strong> de carretera' + daysClause + '.';
      },
      similar: function (hours, daysClause) {
        return 'Os sale prácticamente igual, y os ahorráis <strong>' + hours + ' horas</strong> de coche' + daysClause + '.';
      },
      weWin: function (diff, hours, daysClause) {
        return 'Con nosotros os ahorráis unos <strong>' + diff + ' €</strong>, y además <strong>' + hours + ' horas</strong> de coche' + daysClause + '.';
      },
      daysClauseCheaper: function (d) { return d > 0 ? (', y ' + d + (d === 1 ? ' día de trabajo' : ' días de trabajo')) : ''; },
      daysClauseSimilar: function (d) { return d > 0 ? (' y <strong>' + d + (d === 1 ? ' día' : ' días') + '</strong> de trabajo') : ''; },
      daysClauseWeWin: function (d) { return d > 0 ? (' y ' + d + (d === 1 ? ' día' : ' días') + ' de trabajo') : ''; }
    },
    en: {
      carAmount: function (n) { return '≈ €' + n; },
      carHours: function (h) { return h + ' h driving'; },
      carDays: function (d) { return d + (d === 1 ? ' day off work' : ' days off work'); },
      cheaper: function (diff, hours, daysClause) {
        return 'In money, the car works out about <strong>€' + diff + '</strong> cheaper. What you save with us is <strong>' + hours + ' hours</strong> on the road' + daysClause + '.';
      },
      similar: function (hours, daysClause) {
        return 'It comes out about the same, and you save <strong>' + hours + ' hours</strong> of driving' + daysClause + '.';
      },
      weWin: function (diff, hours, daysClause) {
        return 'With us you save about <strong>€' + diff + '</strong>, plus <strong>' + hours + ' hours</strong> of driving' + daysClause + '.';
      },
      daysClauseCheaper: function (d) { return d > 0 ? (', plus ' + d + (d === 1 ? ' day off work' : ' days off work')) : ''; },
      daysClauseSimilar: function (d) { return d > 0 ? (' and <strong>' + d + (d === 1 ? ' day' : ' days') + '</strong> off work') : ''; },
      daysClauseWeWin: function (d) { return d > 0 ? (' and ' + d + (d === 1 ? ' day' : ' days') + ' off work') : ''; }
    },
    fr: {
      carAmount: function (n) { return '≈ ' + n + ' €'; },
      carHours: function (h) { return h + ' h de route'; },
      carDays: function (d) { return d + (d === 1 ? ' jour de travail' : ' jours de travail'); },
      cheaper: function (diff, hours, daysClause) {
        return 'En argent, la voiture revient environ <strong>' + diff + ' €</strong> moins chère. Ce que vous économisez avec nous : <strong>' + hours + ' heures</strong> de route' + daysClause + '.';
      },
      similar: function (hours, daysClause) {
        return 'C\'est à peu près pareil, et vous économisez <strong>' + hours + ' heures</strong> de route' + daysClause + '.';
      },
      weWin: function (diff, hours, daysClause) {
        return 'Avec nous, vous économisez environ <strong>' + diff + ' €</strong>, plus <strong>' + hours + ' heures</strong> de route' + daysClause + '.';
      },
      daysClauseCheaper: function (d) { return d > 0 ? (', et ' + d + (d === 1 ? ' jour de travail' : ' jours de travail')) : ''; },
      daysClauseSimilar: function (d) { return d > 0 ? (' et <strong>' + d + (d === 1 ? ' jour' : ' jours') + '</strong> de travail') : ''; },
      daysClauseWeWin: function (d) { return d > 0 ? (' et ' + d + (d === 1 ? ' jour' : ' jours') + ' de travail') : ''; }
    }
  };

  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'es').slice(0, 2).toLowerCase();
    return TEXT[l] ? l : 'es';
  }

  function round10(n) { return Math.round(n / 10) * 10; }

  function initOne(root) {
    var t = TEXT[lang()];
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-lb-planb-city]'));
    var carAmount = root.querySelector('[data-lb-planb-car-amount]');
    var carHours = root.querySelector('[data-lb-planb-car-hours]');
    var carDays = root.querySelector('[data-lb-planb-car-days]');
    var verdict = root.querySelector('[data-lb-planb-verdict]');
    if (!buttons.length || !verdict) return;

    function render(cityKey) {
      var c = CITIES[cityKey];
      if (!c) return;
      var diff = round10(c.car - LBX_PRICE);

      if (carAmount) carAmount.textContent = t.carAmount(c.car);
      if (carHours) carHours.textContent = t.carHours(c.hours);
      if (carDays) {
        if (c.days > 0) { carDays.hidden = false; carDays.textContent = t.carDays(c.days); }
        else { carDays.hidden = true; }
      }

      var msg;
      if (diff < -20) {
        msg = t.cheaper(Math.abs(diff), c.hours, t.daysClauseCheaper(c.days));
      } else if (Math.abs(diff) <= 20) {
        msg = t.similar(c.hours, t.daysClauseSimilar(c.days));
      } else {
        msg = t.weWin(diff, c.hours, t.daysClauseWeWin(c.days));
      }
      verdict.innerHTML = msg;
    }

    var initial = buttons.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
    var initialCity = initial ? initial.getAttribute('data-city') : DEFAULT_CITY;

    buttons.forEach(function (btn) {
      var isInitial = btn.getAttribute('data-city') === initialCity;
      btn.setAttribute('aria-pressed', isInitial ? 'true' : 'false');
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        render(btn.getAttribute('data-city'));
      });
    });

    render(initialCity);
  }

  function init() {
    var nodes = document.querySelectorAll('[data-lb-planb]');
    Array.prototype.forEach.call(nodes, initOne);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
