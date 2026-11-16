// Pantallas del juego: bienvenida, inicio, sesión de 5 etapas y bitácora.
import { estado, guardar, hoy, fecha } from './estado.js';
import { jugar, esc, activarTabs, tabsHTML } from './motor.js';
import { avatar, FONDOS } from './personajes.js';
import { panelPadres } from './padres.js';

const app = document.getElementById('app');
const ETAPAS = ['Llegada', 'Aventura', 'Bitácora', 'Misión', 'Cierre'];
const ICONO_HERR = { pregunta_de_vuelta: '🔁', version_corta: '✂️', puente: '🌉', verificacion: '🙋' };
let indice, contenido, enSesion = false;

const json = ruta => fetch(ruta).then(r => { if (!r.ok) throw new Error(ruta); return r.json(); });
const nombre = () => esc(estado.perfil.nombre || 'cronoexplorador');

function pintar(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
}
export function aplicarFuente() {
  document.documentElement.classList.toggle('dislexia', !!estado.ajustes.dislexia);
}

// Krag hablando: retrato + globo. "texto" ya debe venir escapado.
const kragDice = (texto, cara = 'sonrisa') => `<div class="duo">${avatar('krag', cara, 92)}
  <div class="bocadillo lado"><span class="quien">Krag</span><p>${texto}</p></div></div>`;
// Viñeta en miniatura de un destino.
const mini = (escena, abierto) => {
  const f = FONDOS[abierto ? escena : 'base'] || FONDOS.base;
  return `<svg class="mini" viewBox="0 30 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${f.atras}${f.frente}</svg>`;
};

// ---------- Bienvenida ----------
function bienvenida() {
  pintar(`<section class="tarjeta">
    <h1>Cronoexplorador</h1>
    ${kragDice('Soy Krag. Vengo de hace 15.000 años. Sé rastrear mamuts, pero no entiendo las costumbres de los niños de hoy. ¿Me las traduces?')}
    <label class="campo">¿Cómo te llamas?
      <input id="nom" type="text" maxlength="24" autocomplete="off"></label>
    <p class="nota">Para que lo sepas: tus papás pueden ver cuántas aventuras hiciste y tus números. Lo que escribas en tu bitácora es tuyo, y solo lo ven si tú marcas «compartir».</p>
    <button class="btn principal" id="ok">Empezar ▶</button>
  </section>`);
  document.getElementById('ok').onclick = () => {
    estado.perfil.nombre = document.getElementById('nom').value.trim();
    guardar();
    inicio();
  };
}

// ---------- Inicio ----------
export function inicio() {
  enSesion = false;
  const m = estado.mision;
  const destinos = indice.modulos.map(mod => {
    const abierto = mod.escenarios.length > 0;
    const hechas = estado.partidas.filter(p => p.modulo === mod.n).length;
    return `<button class="destino" data-n="${mod.n}" ${abierto ? '' : 'disabled'}>
      <span class="vineta">${mini(mod.escena, abierto)}<span class="sello" aria-hidden="true">${abierto ? mod.icono : '🔒'}</span></span>
      <span class="txt"><strong>${mod.n}. ${esc(mod.nombre)}</strong>
      <small>${esc(mod.tema)}</small>
      <small class="estado">${abierto ? (hechas ? `Visitado ${hechas} ${hechas === 1 ? 'vez' : 'veces'}` : 'Listo para viajar ▶') : 'Próximamente'}</small></span>
    </button>`;
  }).join('');

  pintar(`<section>
    ${kragDice(`¡Hola, ${nombre()}! ¿En qué parte de la cuerda del tiempo enganchamos hoy el cronomosquetón?`)}
    ${m ? `<div class="tarjeta mision">
      <h2>🎯 Tu misión de la semana</h2><p>${esc(m.texto)}</p>
      <div class="acciones"><button class="btn principal" id="intente">Lo intenté</button>
      <button class="btn" id="aun-no">Todavía no</button></div>
      <p class="aviso" id="mis-aviso" aria-live="polite"></p></div>` : ''}
    <h2 class="rotulo">Destinos</h2>
    <div class="destinos">${destinos}</div>
    <div class="acciones abajo">
      <button class="btn grande" id="ir-bitacora">📖 Mi bitácora</button>
      <button class="btn grande" id="ir-padres">🔒 Papás</button>
    </div>
  </section>`);

  app.querySelectorAll('.destino').forEach(b => b.onclick = () => sesion(+b.dataset.n));
  document.getElementById('ir-bitacora').onclick = bitacora;
  document.getElementById('ir-padres').onclick = () => panelPadres(app, { indice, contenido, inicio, aplicarFuente });
  if (m) {
    document.getElementById('aun-no').onclick = () =>
      document.getElementById('mis-aviso').textContent = 'Está bien. La misión te espera, sin apuro.';
    document.getElementById('intente').onclick = () => insignia(m);
  }
}

function insignia(m) {
  pintar(`<section class="tarjeta centro">
    <div class="medalla grande" aria-hidden="true">🏅</div>
    <h1>Insignia: «Lo intenté»</h1>
    ${kragDice('La insignia es por intentarlo, no por cómo resultó. Los exploradores aprendemos de todos los intentos.')}
    <h2>¿Cómo te fue?</h2>
    <div class="acciones col">
      <button class="btn" data-c="Salió bien">🙂 Salió bien</button>
      <button class="btn" data-c="Salió raro">🤔 Salió raro</button>
      <button class="btn" data-c="No sé">🤷 No sé</button>
    </div>
    <p class="nota">Cualquiera de las tres respuestas sirve.</p>
  </section>`);
  app.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
    estado.insignias.push({ mision: m.id, texto: m.texto, foco: m.foco, fecha: hoy(), como: b.dataset.c });
    estado.mision = null;
    guardar();
    inicio();
  });
}

// ---------- Sesión ----------
function barraEtapas(i) {
  return `<ol class="etapas" aria-label="Partes de la sesión">${ETAPAS.map((e, k) =>
    `<li class="${k < i ? 'hecha' : k === i ? 'actual' : ''}" ${k === i ? 'aria-current="step"' : ''}>${k + 1}. ${e}</li>`).join('')}</ol>`;
}
function aviso(i, texto, alSeguir) {
  pintar(`${barraEtapas(i)}<section class="tarjeta cambio">
    <p class="paso">Aviso de cambio</p>
    <h1>Ahora viene: ${ETAPAS[i]}</h1>
    ${kragDice(texto, 'neutral')}
    <button class="btn principal" id="sig">Estoy listo ▶</button></section>`);
  document.getElementById('sig').onclick = alSeguir;
}

async function sesion(n) {
  const mod = indice.modulos.find(m => m.n === n);
  const hechas = estado.partidas.filter(p => p.modulo === n).length;
  const sc = await json(`escenarios/${mod.escenarios[hechas % mod.escenarios.length]}.json`);
  enSesion = true;

  // 1. Llegada
  pintar(`${barraEtapas(0)}<section class="tarjeta">
    <div class="stage portada">${mini(sc.escena, true)}</div>
    <h1>${mod.icono} ${esc(mod.nombre)}</h1>
    <p class="caja">Aventura de hoy: <strong>${esc(sc.titulo)}</strong></p>
    <ol class="ruta">${ETAPAS.map((e, k) => `<li class="${k === 0 ? 'aqui' : ''}">${e}</li>`).join('')}</ol>
    <p class="narr">Cinco partes, siempre en el mismo orden. Dura entre 10 y 15 minutos y no hay reloj: vas a tu ritmo.</p>
    <p class="nota">Antes de cada cambio te voy a avisar. Si necesitas una pausa, la cápsula de calma está siempre arriba.</p>
    <button class="btn principal" id="sig">Enganchar el cronomosquetón ▶</button>
  </section>`);
  document.getElementById('sig').onclick = () => {
    // 2. Aventura
    pintar(`${barraEtapas(1)}<div id="escena"></div>`);
    jugar(sc, document.getElementById('escena'), (reg, vars) => {
      for (const p of sc.persistentes || []) estado.persistentes[p] = vars[p];
      for (const g of reg.glosario) estado.glosario[g] ??= hoy();
      for (const h of reg.herramientas) estado.herramientas[h] = (estado.herramientas[h] || 0) + 1;
      estado.partidas.push({ escenario: sc.id, titulo: sc.titulo, modulo: sc.modulo, foco: sc.foco, fecha: hoy(), ...reg });
      guardar();
      aviso(2, 'Terminó la aventura. Ahora puedes anotar en tu bitácora lo que descubriste.', () => etapaBitacora(sc, reg));
    });
  };
}

const fichaGlosario = g => `<li class="ficha"><strong>${esc(g.expresion)}</strong> <span class="tipo">${esc(g.tipo)}</span>
  <div class="capas"><div><h3>Lo que dice</h3><p>${esc(g.dice)}</p></div><div><h3>Lo que quiere decir</h3><p>${esc(g.quiere_decir)}</p></div></div></li>`;

function etapaBitacora(sc, reg) {
  const nuevas = reg.glosario.map(id => contenido.glosario[id]).filter(Boolean);
  const b = sc.bitacora || { invitacion: '¿Qué ley social descubriste hoy?', sugerencias: [] };
  pintar(`${barraEtapas(2)}<section class="tarjeta">
    <h1>📖 Bitácora</h1>
    ${nuevas.length ? `<h2>Expresiones descifradas hoy</h2><ul class="fichas">${nuevas.map(fichaGlosario).join('')}</ul>` : ''}
    <h2>Ley social descubierta</h2>
    <div class="cuaderno"><label class="campo">${esc(b.invitacion)}
      <textarea id="ley" rows="3" maxlength="300"></textarea></label></div>
    ${b.sugerencias.length ? `<p class="paso">Ideas para partir (puedes tocarlas y cambiarlas):</p>
      <div class="chips">${b.sugerencias.map(s => `<button class="chip">${esc(s)}</button>`).join('')}</div>` : ''}
    <label class="check"><input type="checkbox" id="comp"> Compartir esta ley con mis papás</label>
    <div class="acciones"><button class="btn principal" id="guardar">Guardar en mi bitácora</button>
    <button class="btn" id="saltar">Hoy no quiero escribir</button></div>
  </section>`);
  const ta = document.getElementById('ley');
  app.querySelectorAll('.chip').forEach(c => c.onclick = () => { ta.value = c.textContent; ta.focus(); });
  const sig = () => aviso(3, 'Queda poco. Ahora viene la misión de la semana: algo chico para probar en la vida real.', () => etapaMision(sc));
  document.getElementById('saltar').onclick = sig;
  document.getElementById('guardar').onclick = () => {
    const t = ta.value.trim();
    if (t) {
      estado.leyes.push({ texto: t, fecha: hoy(), escenario: sc.titulo, compartida: document.getElementById('comp').checked });
      guardar();
    }
    sig();
  };
}

function etapaMision(sc) {
  const sig = () => aviso(4, 'Última parte: el cierre. Después de esto termina la sesión de hoy.', cierre);
  if (estado.mision) {
    pintar(`${barraEtapas(3)}<section class="tarjeta"><h1>🎯 Misión de la semana</h1>
      <p class="narr">Tu misión sigue en pie:</p><p class="caja">${esc(estado.mision.texto)}</p>
      <button class="btn principal" id="sig">Continuar ▶</button></section>`);
    document.getElementById('sig').onclick = sig;
    return;
  }
  const hechas = new Set(estado.insignias.map(i => i.mision));
  let ops = contenido.misiones.filter(m => sc.foco.includes(m.foco));
  ops = [...ops.filter(m => !hechas.has(m.id)), ...ops.filter(m => hechas.has(m.id))].slice(0, 2);
  pintar(`${barraEtapas(3)}<section class="tarjeta"><h1>🎯 Misión de la semana</h1>
    <p class="narr">Elige una misión para probar en el colegio o en la casa. La insignia se gana por intentarlo, resulte como resulte.</p>
    <div class="acciones col">${ops.map((m, i) => `<button class="btn mis" data-i="${i}"><b>${'AB'[i]}</b> ${esc(m.texto)}</button>`).join('')}
    <button class="btn" id="sin">Esta semana no quiero misión</button></div></section>`);
  app.querySelectorAll('.mis').forEach(b => b.onclick = () => {
    const m = ops[+b.dataset.i];
    estado.mision = { id: m.id, texto: m.texto, foco: m.foco, desde: hoy() };
    guardar();
    sig();
  });
  document.getElementById('sin').onclick = sig;
}

function cierre() {
  const p = estado.partidas.at(-1);
  const usadas = [...new Set(p.herramientas)].filter(h => contenido.herramientas[h]);
  pintar(`${barraEtapas(4)}<section class="tarjeta">
    <h1>Cierre</h1>
    ${kragDice(`Buen viaje, ${nombre()}. Hoy me tradujiste muchas cosas.`)}
    <div class="botin">
      <div><span aria-hidden="true">🗺️</span><b>${esc(p.titulo)}</b><small>Aventura</small></div>
      <div><span aria-hidden="true">📖</span><b>${p.glosario.length}</b><small>Expresiones nuevas</small></div>
      <div><span aria-hidden="true">🧰</span><b>${usadas.length}</b><small>Herramientas usadas</small></div>
    </div>
    ${usadas.length ? `<p class="narr">${usadas.map(h => `${ICONO_HERR[h] || '🧰'} ${esc(contenido.herramientas[h].nombre)}`).join(' · ')}</p>` : ''}
    ${estado.mision ? `<p class="caja">🎯 Tu misión: ${esc(estado.mision.texto)}</p>` : ''}
    <p class="nota">La sesión de hoy terminó. Puedes volver otro día.</p>
    <button class="btn principal" id="fin">Volver al inicio</button>
  </section>`);
  document.getElementById('fin').onclick = inicio;
}

// ---------- Bitácora ----------
function bitacora() {
  const g = contenido.glosario, ids = Object.keys(g);
  const nG = ids.filter(id => estado.glosario[id]).length;
  const leyes = estado.leyes.map((l, i) => `<li class="cuaderno">
    <p class="ley">«${esc(l.texto)}»</p><small>${fecha(l.fecha)} · ${esc(l.escenario)}</small>
    <label class="check"><input type="checkbox" data-i="${i}" ${l.compartida ? 'checked' : ''}> Compartir con mis papás</label></li>`).join('');
  const glos = ids.map(id => estado.glosario[id] ? fichaGlosario(g[id])
    : `<li class="ficha oculta"><strong>? ? ?</strong><small>Expresión por descubrir</small></li>`).join('');
  const herr = Object.keys(contenido.herramientas).map(id => {
    const h = contenido.herramientas[id], n = estado.herramientas[id] || 0;
    return n ? `<li class="ficha herr"><span class="ico" aria-hidden="true">${ICONO_HERR[id] || '🧰'}</span>
        <div><strong>${esc(h.nombre)}</strong> <span class="tipo">usada ${n} ${n === 1 ? 'vez' : 'veces'}</span><p>${esc(h.que)}</p><p class="por">${esc(h.porque)}</p></div></li>`
      : `<li class="ficha herr oculta"><span class="ico" aria-hidden="true">❔</span><div><strong>? ? ?</strong><small>Herramienta por descubrir</small></div></li>`;
  }).join('');
  const ins = estado.insignias.map(i => `<li><div class="medalla" aria-hidden="true">🏅</div><p>${esc(i.texto)}</p><small>${fecha(i.fecha)}</small></li>`).join('');

  pintar(`<section class="bitacora">
    <h1>📖 Bitácora de ${nombre()}</h1>
    ${tabsHTML([['leyes', `✍️ Leyes <b>${estado.leyes.length}</b>`], ['glosario', `📖 Glosario <b>${nG}/${ids.length}</b>`],
      ['herr', `🧰 Herramientas <b>${Object.keys(estado.herramientas).length}</b>`], ['ins', `🏅 Insignias <b>${estado.insignias.length}</b>`]])}
    <div class="tarjeta" data-panel="leyes"><h2>Mis leyes sociales</h2>
      ${leyes ? `<ul class="fichas">${leyes}</ul>` : '<p class="narr">Todavía no has escrito ninguna ley. Aparecen aquí después de cada aventura.</p>'}
      <p class="nota">Lo que escribes aquí es tuyo. Tus papás solo ven las leyes que marcas para compartir.</p></div>
    <div class="tarjeta" data-panel="glosario"><h2>Expresiones descifradas</h2><ul class="fichas">${glos}</ul></div>
    <div class="tarjeta" data-panel="herr"><h2>Mis herramientas</h2><ul class="fichas">${herr}</ul>
      <p class="nota">Las herramientas son opcionales: tú decides cuándo te sirve usar cada una.</p></div>
    <div class="tarjeta" data-panel="ins"><h2>Insignias «Lo intenté»</h2>
      ${ins ? `<ul class="medallas">${ins}</ul>` : '<p class="narr">Se ganan por intentar la misión de la semana, resulte como resulte.</p>'}</div>
    <button class="btn principal" id="volver">Volver al inicio</button>
  </section>`);
  activarTabs(app);
  app.querySelectorAll('input[data-i]').forEach(c => c.onchange = () => {
    estado.leyes[+c.dataset.i].compartida = c.checked;
    guardar();
  });
  document.getElementById('volver').onclick = inicio;
}

// ---------- Cápsula de calma y arranque ----------
const calma = document.getElementById('calma');
document.getElementById('btn-calma').onclick = () => { calma.hidden = false; document.getElementById('calma-salir').focus(); };
const salirCalma = () => { calma.hidden = true; document.getElementById('btn-calma').focus(); };
document.getElementById('calma-salir').onclick = salirCalma;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !calma.hidden) salirCalma(); });
document.getElementById('btn-inicio').onclick = () => {
  if (!indice) return;
  if (enSesion && !confirm('¿Salir de la sesión? Lo que no se haya guardado de esta aventura se pierde.')) return;
  estado.perfil.nombre || estado.partidas.length ? inicio() : bienvenida();
};

(async function arrancar() {
  aplicarFuente();
  try {
    [indice, contenido] = await Promise.all([json('escenarios/indice.json'), json('contenido/contenido.json')]);
  } catch {
    app.innerHTML = '<p class="narr">No se pudo cargar el juego. Revisa la conexión e inténtalo de nuevo.</p>';
    return;
  }
  estado.perfil.nombre ? inicio() : bienvenida();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
