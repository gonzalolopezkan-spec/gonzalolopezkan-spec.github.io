/*!
 * LetsBoxIt v2 — assets/lb-calc.js
 * Calculadora de precio reutilizable. Se engancha a CUALQUIER [data-lb-calc]
 * (puede haber más de una por página, p.ej. home + precios.html).
 *
 * Markup mínimo esperado dentro de [data-lb-calc] (ver docs/superpowers/ o
 * scratchpad/brief/07-componentes.md para el contrato completo y las clases
 * lb-* exactas):
 *   [data-lb-calc-minus] / [data-lb-calc-plus]   → botones del stepper
 *   [data-lb-calc-boxes-out]                     → <output> con el nº de cajas
 *   [data-lb-calc-tramo]                         → texto "Tramo 5-9 cajas · 33 €/caja"
 *   [data-lb-calc-rows]                          → contenedor de filas de bultos
 *     > [data-lb-calc-row data-price="20"]       → fila-botón (aria-pressed)
 *         > [data-lb-calc-row-name]              → nombre del bulto (texto)
 *   [data-lb-calc-breakdown]                     → líneas del desglose
 *   [data-lb-calc-line-boxes] / [data-lb-calc-line-boxes-total]
 *   [data-lb-calc-total]                         → cifra total
 *   [data-lb-calc-paynote]                       → "Hoy pagas 20 €..."
 *   [data-lb-calc-cta]                            → <a> "Reservar con 20 €"
 *
 * Atributos de configuración en el propio [data-lb-calc]:
 *   data-lb-reserva-href="/reserva.html"  (por defecto; prefijo de idioma si aplica)
 *   data-lb-boxes-default="7" data-lb-boxes-min="1" data-lb-boxes-max="30"
 *   data-lb-session (si está presente, esta instancia SÍ escribe
 *     sessionStorage.lbi_calc). Por defecto NO se toca esa clave: la gestiona
 *     solo /calculadora.html, que guarda un desglose más completo (con
 *     totalBultos por bulto) que reserva.html espera. Si la calculadora
 *     rápida de home/precios también escribiera ahí con un formato más
 *     simple, podría pisar ese desglose.
 *
 * Si existe /api/precios.php y responde {ok:true, tramos:[...], bultos:[...]},
 * se usan esos tramos/bultos en vez de los de por defecto (mismo formato que
 * consume hoy precios.html). Si falla, se usan los de por defecto SIN error
 * visible: la calculadora nunca debe dejar de funcionar por un fallo de red.
 */
(function () {
  'use strict';

  var TEXT = {
    es: {
      boxLabel: function (n) { return n === 1 ? 'caja' : 'cajas'; },
      tramoLabel: function (t) { return 'Tramo ' + t.rango + ' cajas · ' + t.precio + ' €/caja'; },
      lineBoxes: function (n, precio) { return n + ' ' + (n === 1 ? 'caja' : 'cajas') + ' × ' + precio + ' €'; },
      payNote: function (rest) { return 'Hoy pagas <strong>20 €</strong>. El resto, <strong>' + rest + '</strong>, el día de la recogida.'; },
      reservar: 'Reservar con 20 €'
    },
    en: {
      boxLabel: function (n) { return n === 1 ? 'box' : 'boxes'; },
      tramoLabel: function (t) { return t.rango + ' boxes · €' + t.precio + '/box'; },
      lineBoxes: function (n, precio) { return n + ' ' + (n === 1 ? 'box' : 'boxes') + ' × €' + precio; },
      payNote: function (rest) { return 'You pay <strong>€20</strong> today. The rest, <strong>' + rest + '</strong>, on pickup day.'; },
      reservar: 'Book with €20'
    },
    fr: {
      boxLabel: function (n) { return n === 1 ? 'carton' : 'cartons'; },
      tramoLabel: function (t) { return t.rango + ' cartons · ' + t.precio + ' €/carton'; },
      lineBoxes: function (n, precio) { return n + ' ' + (n === 1 ? 'carton' : 'cartons') + ' × ' + precio + ' €'; },
      payNote: function (rest) { return 'Tu payes <strong>20 €</strong> aujourd\'hui. Le reste, <strong>' + rest + '</strong>, le jour de l\'enlèvement.'; },
      reservar: 'Réserver avec 20 €'
    }
  };

  var DEFAULT_TIERS = [
    { min: 1, max: 4, precio: 39, rango: '1-4' },
    { min: 5, max: 9, precio: 33, rango: '5-9' },
    { min: 10, max: 15, precio: 30, rango: '10-15' },
    { min: 16, max: Infinity, precio: 28, rango: '16+' }
  ];

  var DEFAULT_BULTOS = [
    { nombre: 'Silla', precio: 20 },
    { nombre: 'Sofá', precio: 65 },
    { nombre: 'Maceta', precio: 15 },
    { nombre: 'Espejo', precio: 15 },
    { nombre: 'Cómoda', precio: 80 },
    { nombre: 'Maleta pequeña', precio: 35 },
    { nombre: 'Maleta grande', precio: 50 },
    { nombre: 'Mini nevera', precio: 45 }
  ];

  var BULTO_I18N = {
    'silla': { en: 'Chair', fr: 'Chaise' },
    'sofa': { en: 'Sofa', fr: 'Canapé' },
    'maceta': { en: 'Plant pot', fr: 'Pot de fleurs' },
    'espejo': { en: 'Mirror', fr: 'Miroir' },
    'comoda': { en: 'Chest of drawers', fr: 'Commode' },
    'maleta pequena': { en: 'Small suitcase', fr: 'Petite valise' },
    'maleta grande': { en: 'Large suitcase', fr: 'Grande valise' },
    'mini nevera': { en: 'Mini fridge', fr: 'Mini-frigo' },
    'mini neverita': { en: 'Mini fridge', fr: 'Mini-frigo' }
  };

  function bultoLabel(nombre) {
    var l = lang();
    if (l === 'es') return nombre;
    var key = String(nombre).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    var t = BULTO_I18N[key];
    return (t && t[l]) || nombre;
  }

  function fmt(n) {
    return lang() === 'en' ? '€' + n.toLocaleString('en-GB') : n.toLocaleString('es-ES') + ' €';
  }

  function tierFor(tiers, n) {
    for (var i = 0; i < tiers.length; i++) {
      if (n >= tiers[i].min && n <= tiers[i].max) return tiers[i];
    }
    return tiers[tiers.length - 1];
  }

  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'es').slice(0, 2).toLowerCase();
    return TEXT[l] ? l : 'es';
  }

  // ---- carga opcional de tramos/bultos reales desde /api/precios.php ----
  function loadRemoteRates(cb) {
    if (!window.fetch) { cb(null); return; }
    fetch('/api/precios.php').then(function (r) { return r.json(); }).then(function (j) {
      if (!j || j.ok !== true || !Array.isArray(j.tramos) || !j.tramos.length) { cb(null); return; }
      var tiers = j.tramos.map(function (t) {
        var min = t.desde, max = (t.hasta === null || t.hasta === undefined) ? Infinity : t.hasta;
        var rango = (t.hasta === null || t.hasta === undefined) ? (min + '+') : (min + '-' + max);
        return { min: min, max: max, precio: Math.round(t.precio), rango: rango };
      });
      var bultos = null;
      if (Array.isArray(j.bultos) && j.bultos.length) {
        bultos = j.bultos.map(function (b) { return { nombre: b.nombre, precio: Math.round(b.precio) }; });
      }
      cb({ tiers: tiers, bultos: bultos });
    }).catch(function () { cb(null); });
  }

  function buildRow(bulto) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'lb-calc__row';
    row.setAttribute('data-lb-calc-row', '');
    row.setAttribute('data-price', String(bulto.precio));
    row.setAttribute('aria-pressed', 'false');
    row.innerHTML =
      '<span class="lb-calc__row-name"><span class="lb-calc__row-check" aria-hidden="true"></span><span data-lb-calc-row-name>' + bultoLabel(bulto.nombre) + '</span></span>' +
      '<span class="lb-calc__row-price">' + bulto.precio + ' €</span>';
    return row;
  }

  function initOne(root) {
    var t = TEXT[lang()];

    var minusBtn = root.querySelector('[data-lb-calc-minus]');
    var plusBtn = root.querySelector('[data-lb-calc-plus]');
    var out = root.querySelector('[data-lb-calc-boxes-out]');
    var tramoEl = root.querySelector('[data-lb-calc-tramo]');
    var rowsWrap = root.querySelector('[data-lb-calc-rows]');
    var breakdown = root.querySelector('[data-lb-calc-breakdown]');
    var lineBoxes = root.querySelector('[data-lb-calc-line-boxes]');
    var lineBoxesTotal = root.querySelector('[data-lb-calc-line-boxes-total]');
    var totalEl = root.querySelector('[data-lb-calc-total]');
    var payNote = root.querySelector('[data-lb-calc-paynote]');
    var cta = root.querySelector('[data-lb-calc-cta]');

    if (!out || !rowsWrap) return; // markup incompleto: no rompe la página

    var reservaHref = root.getAttribute('data-lb-reserva-href') || '/reserva.html';
    var writeSession = root.hasAttribute('data-lb-session');
    var MIN = parseInt(root.getAttribute('data-lb-boxes-min'), 10) || 1;
    var MAX = parseInt(root.getAttribute('data-lb-boxes-max'), 10) || 30;
    var boxes = parseInt(root.getAttribute('data-lb-boxes-default'), 10) || parseInt(out.textContent, 10) || 7;

    var tiers = DEFAULT_TIERS;
    var chips = [];

    function rebuildRows(bultos) {
      rowsWrap.innerHTML = '';
      chips = bultos.map(function (b) {
        var row = buildRow(b);
        rowsWrap.appendChild(row);
        return row;
      });
      wireRows();
    }

    function wireRows() {
      chips.forEach(function (row) {
        row.addEventListener('click', function () {
          var pressed = row.getAttribute('aria-pressed') === 'true';
          row.setAttribute('aria-pressed', pressed ? 'false' : 'true');
          render();
        });
      });
    }

    function selectedRows() {
      return chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; });
    }

    function persist(total, boxesCount) {
      if (!writeSession || !window.sessionStorage) return;
      try {
        sessionStorage.setItem('lbi_calc', JSON.stringify({ cajas: boxesCount, total: total, ts: Date.now() }));
      } catch (e) { /* almacenamiento bloqueado: no rompe la calculadora */ }
    }

    function render() {
      var tier = tierFor(tiers, boxes);
      var boxesTotal = boxes * tier.precio;

      out.textContent = String(boxes);
      if (minusBtn) minusBtn.disabled = boxes <= MIN;
      if (plusBtn) plusBtn.disabled = boxes >= MAX;
      if (tramoEl) tramoEl.textContent = t.tramoLabel(tier);

      if (lineBoxes) lineBoxes.textContent = t.lineBoxes(boxes, tier.precio);
      if (lineBoxesTotal) lineBoxesTotal.textContent = fmt(boxesTotal);

      if (breakdown) {
        Array.prototype.slice.call(breakdown.querySelectorAll('.line.lb-calc-chip-line')).forEach(function (l) { l.remove(); });
      }

      var chipsTotal = 0;
      selectedRows().forEach(function (row) {
        var p = parseInt(row.getAttribute('data-price'), 10) || 0;
        chipsTotal += p;
        if (breakdown) {
          var nameEl = row.querySelector('[data-lb-calc-row-name]');
          var label = nameEl ? nameEl.textContent.trim() : '';
          var line = document.createElement('div');
          line.className = 'line lb-calc-chip-line';
          line.innerHTML = '<span>' + label + '</span><span>' + fmt(p) + '</span>';
          breakdown.appendChild(line);
        }
      });

      var total = boxesTotal + chipsTotal;
      var deposit = 20;
      var rest = Math.max(0, total - deposit);

      if (totalEl) totalEl.textContent = fmt(total);
      if (payNote) payNote.innerHTML = t.payNote(fmt(rest));
      if (cta) cta.setAttribute('href', reservaHref + (reservaHref.indexOf('?') > -1 ? '&' : '?') + 'cajas=' + boxes);

      persist(total, boxes);
    }

    if (minusBtn) minusBtn.addEventListener('click', function () { boxes = Math.max(MIN, boxes - 1); render(); });
    if (plusBtn) plusBtn.addEventListener('click', function () { boxes = Math.min(MAX, boxes + 1); render(); });

    // filas ya presentes en el HTML (si la página las escribió a mano) o construidas por JS
    var existingRows = Array.prototype.slice.call(rowsWrap.querySelectorAll('[data-lb-calc-row]'));
    if (existingRows.length) { chips = existingRows; wireRows(); render(); }
    else { rebuildRows(DEFAULT_BULTOS); render(); }

    loadRemoteRates(function (remote) {
      if (!remote) return; // fallback silencioso a los valores por defecto
      if (remote.tiers && remote.tiers.length) tiers = remote.tiers;
      if (remote.bultos && remote.bultos.length && !existingRows.length) rebuildRows(remote.bultos);
      render();
    });
  }

  function init() {
    var nodes = document.querySelectorAll('[data-lb-calc]');
    nodes.forEach ? nodes.forEach(initOne) : Array.prototype.forEach.call(nodes, initOne);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
