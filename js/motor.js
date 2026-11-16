// Motor de escenarios: interpreta el JSON nodo por nodo, lo muestra como historieta
// interactiva y registra lo que pasó.
import { estado } from './estado.js';
import { figura, PERSONAJES, FONDOS, NOMBRE_CARA } from './personajes.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const tpl = s => esc(s).replaceAll('{nombre}', esc(estado.perfil.nombre || 'cronoexplorador'));
export const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// Pestañas: botones [data-tab] y paneles [data-panel] dentro de "raiz".
export function activarTabs(raiz, inicial) {
  const tabs = [...raiz.querySelectorAll('[data-tab]')], paneles = [...raiz.querySelectorAll('[data-panel]')];
  const ver = id => {
    tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.tab === id));
    paneles.forEach(p => p.hidden = p.dataset.panel !== id);
  };
  tabs.forEach(t => t.onclick = () => ver(t.dataset.tab));
  ver(inicial || tabs[0]?.dataset.tab);
}
export const tabsHTML = defs => `<div class="tabs no-imprimir" role="tablist">${defs.map(([id, t]) =>
  `<button role="tab" data-tab="${id}">${t}</button>`).join('')}</div>`;

const CANALES = {
  cara: ['🙂', 'Cara'], tono: ['🔊', 'Tono de voz'], cuerpo: ['🧍', 'Cuerpo'],
  contexto: ['📍', 'Situación'], antes: ['⏪', 'Qué pasó antes']
};
// Posición de cada lupa sobre la escena, en porcentaje (x, y).
const LUPAS = {
  cara: [[93, 30]], tono: [[61, 50]], cuerpo: [[86, 80], [66, 80]],
  contexto: [[50, 20], [48, 90], [22, 90]], antes: [[10, 15], [10, 42]]
};
const PASIVOS = ['narracion', 'dialogo', 'fin'];
const COLOR = { yo: '#2f6f73', otro: '#8a5a9c' };

export function cumple(si, v) {
  if (!si) return true;
  if (Array.isArray(si)) return si.every(s => cumple(s, v));
  const a = v[si.var] ?? 0, b = si.valor;
  switch (si.op) {
    case '>=': return a >= b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '<': return a < b;
    case '!=': return a !== b;
    default: return a === b;
  }
}

const bocadillo = (id, texto) => `<div class="bocadillo ${id === 'krag' ? 'izq' : 'der'} entra">
  <span class="quien">${esc(PERSONAJES[id]?.nombre || '')}</span><p>${tpl(texto)}</p></div>`;
const caja = texto => `<p class="caja entra">${tpl(texto)}</p>`;
const certezaTexto = c => c <= 20 ? 'casi nada seguro' : c <= 45 ? 'poco seguro' : c <= 60 ? 'mitad y mitad' : c <= 85 ? 'bastante seguro' : 'casi totalmente seguro';
const num = x => String(x).replace('.', ',');

export function jugar(sc, cont, alTerminar) {
  const v = { ...sc.variables };
  for (const p of sc.persistentes || []) v[p] = estado.persistentes[p] ?? 0;
  const reg = {
    decod: [], termo: [], acertijos: [], secuencia: [],
    palabras: { yo: 0, otro: 0 }, turnos: { yo: 0, otro: 0 },
    preguntas: 0, verificaciones: 0, herramientas: [], glosario: []
  };
  const total = Object.keys(sc.nodos).length;
  let paso = 0;

  // Un turno nuevo (una presa nueva en el muro) se cuenta solo cuando cambia quien habla.
  const sumar = p => {
    if (!p) return;
    for (const k of ['yo', 'otro']) if (p[k] > 0) {
      reg.palabras[k] += p[k];
      const u = reg.secuencia.at(-1);
      if (u && u.q === k) u.n += p[k];
      else { reg.turnos[k]++; reg.secuencia.push({ q: k, n: p[k] }); }
    }
  };
  const aplicar = e => {
    for (const k in e || {}) {
      v[k] = (v[k] ?? 0) + e[k];
      const lim = sc.limites?.[k];
      if (lim) v[k] = Math.max(lim[0], Math.min(lim[1], v[k]));
    }
  };
  const resolver = id => {
    const n = sc.nodos[id];
    const va = (n.variantes || []).find(x => cumple(x.si, v));
    return va ? { ...n, ...va } : n;
  };
  const destino = s => Array.isArray(s) ? (s.find(x => cumple(x.si, v)) || {}).ir : s;
  const otroNombre = () => sc.muro_nombre || PERSONAJES[sc.muro]?.nombre || 'El otro';

  function muro() {
    if (!sc.muro) return '';
    const s = reg.secuencia, n = s.length;
    const paso = n > 1 ? Math.min(40, 268 / (n - 1)) : 0;
    const presas = s.map((t, i) => {
      const r = 6 + Math.min(13, t.n / 6), x = 26 + i * paso, y = 44 - (i % 2) * 16;
      return `<ellipse class="${i === n - 1 ? 'nueva' : ''}" cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="${COLOR[t.q]}" transform="rotate(${(i * 37) % 50 - 25} ${x} ${y})"/>`;
    }).join('');
    return `<figure class="muro" aria-label="Muro de turnos: tú llevas ${reg.turnos.yo} presas y ${esc(otroNombre())} ${reg.turnos.otro}">
      <svg viewBox="0 0 320 68" role="presentation">
        <rect x="2" y="4" width="316" height="60" rx="10" fill="#e9e1d1" stroke="#cfc5b0" stroke-width="2"/>
        <path d="M60 4 L90 64 M170 4 L150 64 M250 4 L262 64" stroke="#dcd3c0" stroke-width="2"/>${presas}
      </svg>
      <figcaption><span class="pt yo"></span> Tus presas: ${reg.turnos.yo} · <span class="pt otro"></span> ${sc.muro_nombre ? '' : 'De '}${esc(otroNombre())}: ${reg.turnos.otro}
        <small>Presa más grande = más palabras en ese turno</small></figcaption>
    </figure>`;
  }

  function ir(id) {
    if (!id) return alTerminar(reg, v);
    const n = resolver(id);
    paso++;
    sumar(n.palabras);
    cont.innerHTML = `<p class="paso">Paso ${paso} de unos ${total}</p>
      <div class="stage"><div class="lienzo"></div><div class="lupas"></div></div>
      ${muro()}
      <div class="dialogo" aria-live="polite"></div>
      <ul class="bandeja" hidden></ul>
      <div class="cuerpo"></div>`;
    const $ = s => cont.querySelector(s);
    const ui = { lienzo: $('.lienzo'), lupas: $('.lupas'), dialogo: $('.dialogo'), bandeja: $('.bandeja'), cuerpo: $('.cuerpo') };
    let caraHabla = n.cara || 'neutral', caraKrag = 'neutral', quien = n.habla;

    const dibujar = () => {
      const f = FONDOS[sc.escena] || FONDOS.base;
      const hay = quien && quien !== 'krag';
      ui.lienzo.innerHTML = `<svg viewBox="0 0 400 230" role="img" aria-label="Escena: Krag${hay ? ` y ${PERSONAJES[quien].nombre}, ${NOMBRE_CARA[caraHabla] || ''}` : ''}">
        ${f.atras}${figura('krag', caraKrag, 26, 56, 1.15)}${hay ? figura(quien, caraHabla, 236, 36, 1.3) : ''}${f.frente}</svg>`;
    };
    dibujar();

    const avanzar = dest => {
      if (n.glosario && !reg.glosario.includes(n.glosario)) reg.glosario.push(n.glosario);
      ir(destino(dest));
    };
    const seguir = (dest = n.siguiente, texto = 'Continuar ▶') => {
      const b = el(`<button class="btn principal entra">${texto}</button>`);
      b.onclick = () => avanzar(dest);
      ui.cuerpo.append(b);
    };
    const api = {
      ui,
      cara(c, q) { if (q) quien = q; if (c) caraHabla = c; dibujar(); },
      cerrarPistas() { ui.lupas.innerHTML = ''; ui.bandeja.querySelector('.guia')?.remove(); if (!ui.bandeja.children.length) ui.bandeja.hidden = true; }
    };

    // La escena se cuenta de a un cuadro: cada toque muestra el siguiente.
    const cuadros = [];
    if (n.contexto) cuadros.push({ html: caja(n.contexto) });
    if (n.texto) cuadros.push({ html: caja(n.texto) });
    if (n.habla && n.frase) cuadros.push({ html: bocadillo(n.habla, n.frase), frase: true });
    if (n.krag) cuadros.push({ html: bocadillo('krag', n.krag), krag: true });
    if (n.nota) cuadros.push({ html: `<p class="nota entra">${tpl(n.nota)}</p>` });
    const pasivo = PASIVOS.includes(n.tipo);

    const interactuar = () => {
      // Durante la interacción queda a la vista la frase clave (y la nota, si hay).
      const fijo = cuadros.filter(c => c.frase).concat(n.nota ? cuadros.at(-1) : []);
      ui.dialogo.innerHTML = (fijo.length ? fijo : cuadros.slice(-1)).map(c => c.html).join('');
      const vistas = lupasUI(n, ui);
      TIPOS[n.tipo](n, ui.cuerpo, seguir, api, vistas);
    };
    let i = 0;
    const mostrar = () => {
      const c = cuadros[i], ultimo = i === cuadros.length - 1;
      if (c.krag) { caraKrag = n.krag_cara || 'sorpresa'; dibujar(); }
      ui.dialogo.innerHTML = c.html;
      if (ultimo && !pasivo) return interactuar();
      const b = el(`<button class="btn principal sigue">${ultimo ? (n.tipo === 'fin' ? 'Terminar la aventura' : 'Continuar ▶') : 'Sigue ▶'}</button>`);
      b.onclick = () => { if (ultimo) avanzar(n.siguiente); else { i++; mostrar(); } };
      ui.dialogo.append(b);
    };
    if (cuadros.length) mostrar(); else if (pasivo) seguir(); else interactuar();
    window.scrollTo(0, 0);
  }

  // Pistas del detective: lupas sobre la escena. Devuelve una función que dice cuántas se revisaron.
  function lupasUI(n, ui) {
    let vistas = 0;
    if (!n.pistas?.length || n.tipo === 'acertijo') return () => 0; // en un acertijo, "pistas" son ayudas de texto
    const usados = {};
    ui.bandeja.hidden = false;
    ui.bandeja.innerHTML = `<li class="guia">🔍 Toca las lupas de la escena para buscar pistas. Hay ${n.pistas.length}.</li>`;
    n.pistas.forEach(p => {
      const k = usados[p.canal] = (usados[p.canal] ?? -1) + 1;
      const lista = LUPAS[p.canal] || LUPAS.contexto;
      const [x, y] = lista[k % lista.length];
      const [ico, nom] = CANALES[p.canal] || ['🔍', 'Pista'];
      const b = el(`<button class="lupa" style="left:${x}%;top:${y}%" aria-label="Buscar pista: ${nom}">🔍</button>`);
      b.onclick = () => {
        vistas++;
        b.remove();
        ui.bandeja.append(el(`<li class="entra"><span aria-hidden="true">${ico}</span> <strong>${nom}:</strong> ${tpl(p.texto)}</li>`));
      };
      ui.lupas.append(b);
    });
    return () => vistas;
  }

  const TIPOS = {
    decision(n, c, seguir, api) {
      const cajaOp = el(`<section class="opciones entra"><h3>${tpl(n.pregunta || '¿Qué haces?')}</h3></section>`);
      n.opciones.filter(o => cumple(o.si, v)).forEach((o, i) => {
        const fila = el(`<div class="opcion">
          <button class="elegir"><b>${'ABC'[i] || ''}</b><span>${tpl(o.texto)}</span></button>
          ${o.pensamiento ? `<button class="pensar" aria-label="Ver qué estarías pensando">💭</button><p class="pens" hidden>💭 ${tpl(o.pensamiento)}</p>` : ''}
        </div>`);
        const pens = fila.querySelector('.pensar');
        if (pens) pens.onclick = () => { fila.querySelector('.pens').hidden = false; pens.hidden = true; };
        fila.querySelector('.elegir').onclick = () => {
          aplicar(o.efectos);
          sumar(o.palabras);
          if (o.pregunta) reg.preguntas++;
          if (o.verificacion) { reg.verificaciones++; reg.herramientas.push('verificacion'); }
          if (o.herramienta) reg.herramientas.push(o.herramienta);
          api.cerrarPistas();
          if (o.cara) api.cara(o.cara);
          if (sc.muro) cont.querySelector('.muro').outerHTML = muro();
          api.ui.dialogo.innerHTML = `<p class="elegida entra"><strong>Elegiste:</strong> ${tpl(o.texto)}</p>${caja(o.consecuencia)}`;
          c.innerHTML = `<div class="porque entra"><h3>Por qué</h3><p>${tpl(o.porque)}</p></div>`;
          seguir(o.siguiente || n.siguiente);
        };
        cajaOp.append(fila);
      });
      c.append(cajaOp);
    },

    decodificador(n, c, seguir, api, vistas) {
      const orden = n.significados.map((s, i) => i).sort(() => Math.random() - 0.5);
      const mejor = n.significados.reduce((m, s, i, a) => s.plausibilidad > a[m].plausibilidad ? i : m, 0);
      const capas = segunda => `<div class="maquina"><p class="rotulo">Decodificador de significado</p><div class="capas">
        <div><h3>Lo que dice</h3><p>«${tpl(n.frase)}»</p></div>
        <div class="${segunda ? 'lista' : ''}"><h3>Lo que quiere decir</h3><p class="${segunda ? '' : 'incog'}">${segunda || '¿ … ?'}</p></div></div></div>`;
      const cajaD = el(`<section class="decod entra">
        ${capas('')}
        <h3>Tu hipótesis: ¿qué quiere decir?</h3>
        <div class="sigs"></div>
        <label class="certeza">¿Qué tan seguro estás? <output>50 %</output> <small class="ct">mitad y mitad</small>
          <input type="range" min="0" max="100" step="5" value="50" aria-label="Certeza en porcentaje"></label>
        <div class="acciones">
          <button class="btn principal confirmar" disabled>Confirmar mi hipótesis</button>
          ${n.verificacion ? `<button class="btn preguntar">🙋 Mejor pregunto: «${tpl(n.verificacion.pregunta)}»</button>` : ''}
        </div>
      </section>`);
      let elegido = null;
      const sigs = cajaD.querySelector('.sigs');
      orden.forEach(i => {
        const b = el(`<button class="sig" aria-pressed="false">${tpl(n.significados[i].texto)}</button>`);
        b.onclick = () => {
          elegido = i;
          sigs.querySelectorAll('.sig').forEach(x => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
          cajaD.querySelector('.confirmar').disabled = false;
        };
        sigs.append(b);
      });
      const rango = cajaD.querySelector('input');
      rango.oninput = () => {
        cajaD.querySelector('output').textContent = rango.value + ' %';
        cajaD.querySelector('.ct').textContent = certezaTexto(+rango.value);
      };

      const cerrar = pregunto => {
        const certeza = elegido === null ? null : +rango.value;
        const acierto = elegido === null ? null : elegido === mejor;
        reg.decod.push({ frase: n.frase, acierto, certeza, pistas: vistas(), ambiguo: !!n.ambiguo, verifico: pregunto });
        if (pregunto) { reg.verificaciones++; reg.preguntas++; reg.herramientas.push('verificacion'); }
        api.cerrarPistas();

        let cal = '';
        if (elegido !== null) {
          if (n.ambiguo) cal = certeza <= 60
            ? 'Tu certeza fue baja, y eso es estar bien calibrado: de verdad no se podía saber.'
            : 'Elegiste con harta certeza. Mira las barras: aquí las pistas apuntaban hacia varios lados.';
          else if (acierto) cal = certeza >= 70
            ? 'Las pistas eran fuertes y tu certeza también. Bien calibrado.'
            : 'Elegiste lo más probable. Las pistas eran fuertes: puedes confiar más en tu hipótesis.';
          else cal = 'Es una hipótesis posible. Mira las barras: las pistas apuntan con más fuerza hacia otra.';
        }
        const barras = n.significados.map((s, i) => {
          const pct = Math.round(s.plausibilidad * 100);
          return `<div class="barra-fila ${i === elegido ? 'mia' : ''}"><span>${tpl(s.texto)}${i === elegido ? ' <em>(tu hipótesis)</em>' : ''}</span>
            <div class="barra"><i style="width:${pct}%"></i></div><b>${pct} %</b></div>`;
        }).join('');
        const segunda = n.ambiguo && !pregunto ? tpl(n.incierto || 'Incierto: faltan pistas. Aquí conviene preguntar.') : tpl(n.significados[mejor].texto);
        if (pregunto) api.ui.dialogo.innerHTML = `<p class="elegida entra"><strong>Preguntaste:</strong> «${tpl(n.verificacion.pregunta)}»</p>${caja(n.verificacion.respuesta)}`;
        c.innerHTML = `<div class="entra">${capas(segunda)}
          <div class="resultado"><h3>Qué tan probable era cada significado</h3>${barras}
            ${certeza !== null ? `<p>Tu certeza: <strong>${certeza} %</strong>. ${cal}</p>` : ''}
            ${pregunto ? '<p>Preguntar es una herramienta de experto: cambia una duda por un dato.</p>' : ''}</div>
          <div class="porque"><h3>Por qué</h3><p>${tpl(n.explicacion)}</p></div>
          ${n.glosario ? '<p class="nota">📖 Nueva expresión descifrada para tu glosario.</p>' : ''}</div>`;
        seguir();
      };
      cajaD.querySelector('.confirmar').onclick = () => cerrar(false);
      const bp = cajaD.querySelector('.preguntar');
      if (bp) bp.onclick = () => cerrar(true);
      c.append(cajaD);
    },

    termometro(n, c, seguir, api) {
      const real = Math.round(typeof n.real === 'string' ? v[n.real] ?? 0 : n.real);
      const nombre = PERSONAJES[n.sobre]?.nombre || 'la otra persona';
      const tubo = (est, conReal) => `<div class="tubo" aria-hidden="true">
          <i class="nivel" style="height:${(est ?? 0) * 10}%"></i>
          ${conReal ? `<span class="real" style="bottom:${real * 10}%"><b>Real: ${real}</b></span>` : ''}
          <span class="g" style="bottom:0">0</span><span class="g" style="bottom:50%">5</span><span class="g" style="bottom:100%">10</span></div>`;
      const cajaT = el(`<section class="termo entra">
        <h3>Señales que observas en ${esc(nombre)}</h3>
        <ul class="senales">${n.senales.map(s => `<li>${tpl(s)}</li>`).join('')}</ul>
        <h3>${tpl(n.pregunta)}</h3>
        <div class="medidor">${tubo(5, false)}
          <label class="certeza">Mi estimación: <output>5</output> <small>de 10</small>
            <input type="range" min="0" max="10" step="1" value="5" aria-label="Estimación de interés de 0 a 10"></label></div>
        <div class="acciones">
          <button class="btn principal estimar">Esta es mi estimación</button>
          ${n.preguntar ? `<button class="btn preguntar">🙋 Mejor pregunto: «${tpl(n.preguntar.dices)}»</button>` : ''}
        </div>
      </section>`);
      const rango = cajaT.querySelector('input');
      rango.oninput = () => {
        cajaT.querySelector('output').textContent = rango.value;
        cajaT.querySelector('.nivel').style.height = rango.value * 10 + '%';
      };
      cajaT.querySelector('.estimar').onclick = () => {
        const est = +rango.value, dif = Math.abs(est - real);
        reg.termo.push({ estimado: est, real, pregunto: false });
        c.innerHTML = `<div class="entra"><div class="resultado medidor">${tubo(est, true)}
          <div><h3>Termómetro de interés</h3><p>Tu estimación: <strong>${est}</strong>. Valor real: <strong>${real}</strong>.</p>
          <p>${dif <= 2 ? `Diferencia de ${dif}: quedó muy cerca.` : `Diferencia de ${dif}. Las señales a veces engañan; por eso es una estimación y no una certeza.`}</p></div></div>
          <div class="porque"><h3>Por qué</h3><p>${tpl(n.explicacion)}</p></div></div>`;
        seguir();
      };
      const bp = cajaT.querySelector('.preguntar');
      if (bp) bp.onclick = () => {
        const r = n.preguntar.respuestas.find(x => real <= x.max) || n.preguntar.respuestas.at(-1);
        reg.termo.push({ estimado: null, real, pregunto: true });
        reg.preguntas++; reg.verificaciones++; reg.herramientas.push('verificacion');
        sumar({ yo: n.preguntar.dices.split(/\s+/).length, otro: r.texto.split(/\s+/).length });
        api.cara(r.cara, n.sobre);
        if (sc.muro) cont.querySelector('.muro').outerHTML = muro();
        api.ui.dialogo.innerHTML = `<p class="elegida entra"><strong>Preguntaste:</strong> «${tpl(n.preguntar.dices)}»</p>${bocadillo(n.sobre, r.texto)}`;
        c.innerHTML = `<div class="entra"><div class="resultado medidor">${tubo(real, true)}
          <div><h3>Termómetro de interés</h3><p>Valor real: <strong>${real}</strong>.</p><p>Preguntar vale tanto como estimar: obtuviste el dato directo.</p></div></div>
          <div class="porque"><h3>Por qué</h3><p>${tpl(n.explicacion)}</p></div></div>`;
        seguir();
      };
      c.append(cajaT);
    },

    acertijo(n, c, seguir) {
      let intentos = 0, pistas = 0, valor = '';
      const teclas = [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'OK'];
      const cajaA = el(`<section class="acertijo entra">
        <h3>Desafío numérico</h3><p class="enun">${tpl(n.enunciado)}</p>
        <div class="teclado">
          <output class="visor" aria-label="Tu respuesta" aria-live="polite">_</output>
          ${teclas.map(t => `<button class="tecla ${t === 'OK' ? 'ok' : ''}" data-t="${t}" ${t === '⌫' ? 'aria-label="Borrar"' : ''}>${t}</button>`).join('')}
        </div>
        <p class="aviso" aria-live="polite"></p><ul class="ayudas"></ul>
        <div class="acciones">
          <button class="btn pista-btn">💡 Quiero una pista</button>
          <button class="btn solucion">Ver la solución</button>
        </div>
      </section>`);
      const visor = cajaA.querySelector('.visor'), aviso = cajaA.querySelector('.aviso');
      const fin = resuelto => {
        reg.acertijos.push({ intentos, pistas, resuelto });
        c.innerHTML = `<div class="resultado entra"><h3>${resuelto ? '✔ ¡Resuelto!' : 'La solución'}</h3><p>${tpl(n.explicacion)}</p></div>`;
        seguir();
      };
      const probar = () => {
        if (valor === '') { aviso.textContent = 'Marca un número para probarlo.'; return; }
        intentos++;
        if (+valor === n.respuesta) return fin(true);
        aviso.textContent = `${num(valor)} no calza con todas las condiciones. Puedes probar otro número o pedir una pista.`;
        valor = ''; visor.textContent = '_';
      };
      cajaA.querySelectorAll('.tecla').forEach(b => b.onclick = () => {
        const t = b.dataset.t;
        if (t === 'OK') return probar();
        valor = t === '⌫' ? valor.slice(0, -1) : (valor + t).slice(0, 6);
        visor.textContent = valor || '_';
        aviso.textContent = '';
      });
      cajaA.querySelector('.pista-btn').onclick = e => {
        if (pistas < (n.pistas || []).length) cajaA.querySelector('.ayudas').append(el(`<li class="entra">${tpl(n.pistas[pistas++])}</li>`));
        if (pistas >= (n.pistas || []).length) e.target.disabled = true;
      };
      cajaA.querySelector('.solucion').onclick = () => fin(false);
      c.append(cajaA);
    },

    grafico(n, c, seguir) {
      const { yo, otro } = reg.palabras, tot = yo + otro || 1;
      const pct = Math.round(yo / tot * 100);
      const fila = (nom, val, max, clase) => `<div class="barra-fila"><span>${esc(nom)}</span>
        <div class="barra"><i class="${clase}" style="width:${Math.round(val / (max || 1) * 100)}%"></i></div><b>${val}</b></div>`;
      const mt = Math.max(reg.turnos.yo, reg.turnos.otro), mp = Math.max(yo, otro);
      c.innerHTML = `<div class="resultado entra">
        <h3>Palabras de cada uno</h3>${fila('Tú', yo, mp, 'yo')}${fila(otroNombre(), otro, mp, 'otro')}
        <h3>Turnos en el muro (presas)</h3>${fila('Tú', reg.turnos.yo, mt, 'yo')}${fila(otroNombre(), reg.turnos.otro, mt, 'otro')}
        <h3>Tu parte de la conversación: ${pct} %</h3>
        <div class="reparto" aria-label="Tu parte fue ${pct} por ciento. La zona pareja va de 30 a 70 por ciento."><div class="zona"></div><span class="punto" style="left:${pct}%"></span></div>
        <div class="ejes"><span>0 %</span><span>zona pareja: 30 % a 70 %</span><span>100 %</span></div>
        <p>Preguntas que hiciste: <strong>${reg.preguntas}</strong>.</p></div>`;
      seguir();
    }
  };

  ir(sc.inicio);
}
