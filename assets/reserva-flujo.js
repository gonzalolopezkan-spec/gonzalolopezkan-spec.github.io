// ═══════════════════════════════════════════════════════════════
// assets/reserva-flujo.js — LetsBoxIt
// Calendario de disponibilidad en tiempo real del formulario de
// reserva (Lote 5). Compartido por los 3 idiomas (reserva.html,
// en/reserva.html, fr/reserva.html); los textos vienen de
// window.LBI_RESERVA_CFG (definido en un <script> corto por página).
// Los valores que escribe en los campos (fecha ISO, etiqueta de
// franja) SIEMPRE están en español -- son los mismos names/values que
// ya esperaba el backend antes de este Lote, solo cambia cómo se
// rellenan (calendario en vez de <input>/<select> tecleados a mano).
//
// Degradación elegante: si fetch('/api/disponibilidad.php') falla o
// responde ok:false, esta función simplemente no hace nada más -- el
// <input type="date"> y el <select> nativos (que NUNCA se tocan del
// DOM, solo se ocultan con CSS si el calendario carga bien) siguen
// siendo los que ve y usa el cliente, exactamente como antes del Lote 5.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var MESES_LARGOS = {
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  };
  var DIAS_CORTOS = {
    es: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    fr: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function crearWidget(contenedor, fechaInput, franjaSelect, fieldGroupNativo, textos, idioma) {
    var meses = MESES_LARGOS[idioma] || MESES_LARGOS.es;
    var diasCortos = DIAS_CORTOS[idioma] || DIAS_CORTOS.es;
    var sel = { fecha: fechaInput.value || null, franja: franjaSelect.value || null };
    var cargado = false; // true solo cuando el calendario sustituyó a los inputs nativos

    function marcarValido() {
      var campo = contenedor.closest('.field');
      if (campo) { campo.classList.remove('error'); }
      var err = campo ? campo.querySelector('.field-error') : null;
      if (err) { err.style.display = 'none'; }
    }

    // '2026-07-14' -> '14 julio 2026' (o '14 July 2026' / '14 juillet 2026'):
    // reutiliza los nombres de mes que ya usa el calendario, sin partículas
    // gramaticales para que la MISMA función valga para los 3 idiomas.
    function fechaHumana(iso) {
      var p = String(iso).split('-');
      if (p.length !== 3) { return iso; }
      var mes = meses[Number(p[1]) - 1] || '';
      return Number(p[2]) + ' ' + mes + ' ' + p[0];
    }

    // Aviso visible dentro del contenedor del calendario (modo calendario):
    // lo comparten el 409 (repintarConflicto) y el submit sin selección.
    // Se oculta al completar día+franja (actualizarResumen).
    function avisoCalendario(mensaje) {
      var aviso = contenedor.querySelector('.lbi-cal-conflicto');
      if (!aviso) {
        aviso = document.createElement('p');
        aviso.className = 'lbi-cal-conflicto';
        aviso.setAttribute('role', 'alert');
        var franjasTit = contenedor.querySelector('.lbi-cal-franjas-tit');
        if (franjasTit) { franjasTit.parentNode.insertBefore(aviso, franjasTit); }
        else { contenedor.appendChild(aviso); }
      }
      aviso.textContent = mensaje;
      aviso.style.display = '';
    }

    // El <select> nativo trae las 3 franjas de fábrica hardcodeadas en el
    // HTML (son el fallback del modo degradado y NO se tocan si la API
    // falla). Con el calendario activo, la fuente de verdad es el catálogo
    // que sirve la API: se reescriben las <option> con la unión ordenada de
    // etiquetas de dias[].franjas, conservando la placeholder vacía, para
    // que franjaSelect.value = etiqueta case SIEMPRE -- también con franjas
    // nuevas añadidas por el admin que el HTML estático no conoce.
    function sincronizarSelect(dias) {
      var etiquetas = [];
      var vistas = {};
      dias.forEach(function (d) {
        (d.franjas || []).forEach(function (f) {
          if (!vistas.hasOwnProperty(f.etiqueta)) {
            vistas[f.etiqueta] = true;
            etiquetas.push(f.etiqueta);
          }
        });
      });
      if (!etiquetas.length) { return; } // sin datos, se deja el select de fábrica
      var placeholder = null;
      var ops = franjaSelect.querySelectorAll('option');
      for (var i = 0; i < ops.length; i++) {
        if (ops[i].value === '') { placeholder = ops[i]; break; }
      }
      while (franjaSelect.firstChild) { franjaSelect.removeChild(franjaSelect.firstChild); }
      if (placeholder) { franjaSelect.appendChild(placeholder); }
      etiquetas.forEach(function (et) {
        var op = document.createElement('option');
        op.value = et;        // nunca innerHTML: la etiqueta es dato editable
        op.textContent = et;
        franjaSelect.appendChild(op);
      });
    }

    function actualizarResumen() {
      var resumen = contenedor.querySelector('.lbi-cal-resumen');
      if (!resumen) { return; }
      if (sel.fecha && sel.franja) {
        resumen.innerHTML = (textos.elegido || 'Elegido:') + ' <strong>' + esc(fechaHumana(sel.fecha)) + ' · ' + esc(sel.franja) + '</strong>';
        marcarValido();
        var aviso = contenedor.querySelector('.lbi-cal-conflicto');
        if (aviso) { aviso.style.display = 'none'; }
      } else {
        resumen.textContent = '';
      }
    }

    function seleccionarFecha(fecha, dias) {
      sel.fecha = fecha;
      sel.franja = null;
      fechaInput.value = fecha;
      franjaSelect.value = '';
      contenedor.querySelectorAll('.lbi-cal-dia').forEach(function (b) {
        b.classList.toggle('lbi-cal-sel', b.getAttribute('data-fecha') === fecha);
      });
      var diaObj = null;
      for (var i = 0; i < dias.length; i++) { if (dias[i].fecha === fecha) { diaObj = dias[i]; break; } }
      pintarFranjas(diaObj ? diaObj.franjas : []);
      actualizarResumen();
    }

    function pintarFranjas(franjas) {
      var cont = contenedor.querySelector('.lbi-cal-franjas');
      if (!cont) { return; }
      cont.innerHTML = '';
      franjas.forEach(function (f) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lbi-cal-franja' + (f.estado === 'pocas' ? ' lbi-cal-franja-pocas' : '')
          + (f.etiqueta === sel.franja ? ' lbi-cal-sel' : '');
        btn.textContent = f.etiqueta;
        if (f.estado === 'lleno') { btn.disabled = true; }
        btn.setAttribute('data-franja', f.etiqueta);
        btn.addEventListener('click', function () {
          sel.franja = f.etiqueta;
          franjaSelect.value = f.etiqueta;
          cont.querySelectorAll('.lbi-cal-franja').forEach(function (x) { x.classList.remove('lbi-cal-sel'); });
          btn.classList.add('lbi-cal-sel');
          actualizarResumen();
        });
        cont.appendChild(btn);
      });
    }

    function pintar(dias) {
      if (!dias.length) {
        contenedor.innerHTML = '<p class="lbi-cal-error">' + esc(textos.sin_huecos || 'No hay huecos disponibles ahora mismo.') + '</p>';
        return;
      }
      var meses_agrupados = {};
      var ordenMeses = [];
      dias.forEach(function (d) {
        var clave = d.fecha.slice(0, 7);
        if (!meses_agrupados[clave]) { meses_agrupados[clave] = []; ordenMeses.push(clave); }
        meses_agrupados[clave].push(d);
      });

      var html = '';
      ordenMeses.forEach(function (clave) {
        var partes = clave.split('-');
        html += '<p class="lbi-cal-mes">' + esc(meses[Number(partes[1]) - 1]) + ' ' + esc(partes[0]) + '</p>'
              + '<div class="lbi-cal-dias">';
        meses_agrupados[clave].forEach(function (d) {
          var num = Number(d.fecha.slice(8, 10));
          var diaSemana = diasCortos[new Date(d.fecha + 'T00:00:00').getDay()];
          html += '<button type="button" class="lbi-cal-dia" data-fecha="' + esc(d.fecha) + '">'
            + '<span class="lbi-cal-dia-num">' + num + '</span>'
            + '<span class="lbi-cal-dia-sem">' + esc(diaSemana) + '</span>'
            + '</button>';
        });
        html += '</div>';
      });
      html += '<p class="lbi-cal-franjas-tit">' + esc(textos.elige_franja || 'Elige una franja') + '</p>'
            + '<div class="lbi-cal-franjas"></div>'
            + '<p class="lbi-cal-resumen"></p>';
      contenedor.innerHTML = html;

      contenedor.querySelectorAll('.lbi-cal-dia').forEach(function (b) {
        b.addEventListener('click', function () { seleccionarFecha(b.getAttribute('data-fecha'), dias); });
      });

      // Preselección si el input nativo ya traía un valor (p.ej. venía
      // relleno de la calculadora) y esa fecha sigue disponible.
      if (sel.fecha) {
        var existe = false;
        for (var i = 0; i < dias.length; i++) { if (dias[i].fecha === sel.fecha) { existe = true; break; } }
        if (existe) { seleccionarFecha(sel.fecha, dias); }
      }
    }

    // Aviso de conflicto (409) en MODO DEGRADADO: el calendario no cargó
    // (inputs nativos visibles), así que no hay rejilla que re-pintar.
    // Se muestra bajo el select de franja qué franjas siguen libres según
    // el propio 409 y se deja reintentar -- la venta solo se degrada al
    // flujo ciego con errores nuestros (red/5xx), nunca con un 409 legítimo.
    function mostrarConflictoNativo(alternativas) {
      var campo = franjaSelect.closest('.field') || fieldGroupNativo;
      var aviso = campo.querySelector('.lbi-cal-conflicto');
      if (!aviso) {
        aviso = document.createElement('p');
        aviso.className = 'lbi-cal-conflicto';
        aviso.setAttribute('role', 'alert');
        campo.appendChild(aviso);
        var ocultar = function () { aviso.style.display = 'none'; };
        franjaSelect.addEventListener('change', ocultar);
        fechaInput.addEventListener('change', ocultar);
      }
      var etiquetas = [];
      (alternativas || []).forEach(function (a) {
        if (a.estado !== 'lleno') { etiquetas.push(a.etiqueta); }
      });
      if (etiquetas.length) {
        aviso.textContent = (textos.franja_llena || 'Esa franja acaba de llenarse — prueba:') + ' ' + etiquetas.join(' · ');
      } else {
        aviso.textContent = textos.dia_lleno || 'Ese día se acaba de llenar — prueba con otra fecha.';
      }
      aviso.style.display = '';
      sel.franja = null;
      franjaSelect.value = '';
      if (typeof campo.scrollIntoView === 'function') {
        campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    fetch('/api/disponibilidad.php')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) { throw new Error('ok:false'); }
        sincronizarSelect(d.dias || []);
        cargado = true;
        fieldGroupNativo.style.display = 'none';
        contenedor.hidden = false;
        pintar(d.dias || []);
      })
      .catch(function () {
        // Degradación: no se toca nada, el field-group nativo sigue visible.
      });

    // Feedback visible si se envía sin día/franja elegidos con el calendario
    // activo: la validación inline de la página marca los inputs nativos,
    // pero están ocultos (display:none) y el usuario no vería nada. Este
    // listener se registra DESPUÉS del handler inline (que corre primero y
    // ya ha marcado .invalid y cortado el envío), así que solo añade la
    // capa visible. En modo degradado no hace nada: los inputs nativos
    // visibles ya dan su propio feedback.
    var form = fechaInput.form;
    if (form) {
      form.addEventListener('submit', function () {
        if (!cargado) { return; }
        if (fechaInput.value && franjaSelect.value) { return; }
        avisoCalendario(textos.elige_hueco || 'Elige un día y una franja para la recogida 👆');
        var primerInvalido = form.querySelector('.invalid');
        if (!primerInvalido || primerInvalido === fechaInput || primerInvalido === franjaSelect) {
          contenedor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    // Expuesto para que el handler de submit re-pinte tras un 409 sin
    // otra llamada a la API (usa las franjas_alternativas que ya trae
    // la respuesta del servidor).
    return {
      repintarConflicto: function (fecha, alternativas, mensaje) {
        if (!cargado) {
          mostrarConflictoNativo(alternativas);
          return;
        }
        var alternativasEtiquetas = {};
        (alternativas || []).forEach(function (a) { alternativasEtiquetas[a.etiqueta] = a.estado; });
        var franjasCatalogo = franjaSelect.querySelectorAll('option');
        var franjasParaDia = [];
        franjasCatalogo.forEach(function (op) {
          if (!op.value) { return; }
          franjasParaDia.push({
            etiqueta: op.value,
            estado: alternativasEtiquetas.hasOwnProperty(op.value) ? alternativasEtiquetas[op.value] : 'lleno'
          });
        });
        sel.franja = null;
        franjaSelect.value = '';
        pintarFranjas(franjasParaDia);
        avisoCalendario(mensaje);
      }
    };
  }

  function initCalendario(contenedorId) {
    var cont = document.getElementById(contenedorId);
    if (!cont) { return; }
    var fechaInput  = document.getElementById(cont.getAttribute('data-lbi-fecha'));
    var franjaSelect = document.getElementById(cont.getAttribute('data-lbi-franja'));
    if (!fechaInput || !franjaSelect) { return; }
    var fieldGroupNativo = fechaInput.closest('.field-group') || fechaInput.closest('.field');
    var cfg = window.LBI_RESERVA_CFG || {};
    var instancia = crearWidget(cont, fechaInput, franjaSelect, fieldGroupNativo, cfg.textos || {}, cfg.idioma || 'es');
    window.LBIReservaFlujo = window.LBIReservaFlujo || {};
    window.LBIReservaFlujo[contenedorId] = instancia;
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCalendario('lbiCalRecogida');
  });
})();
