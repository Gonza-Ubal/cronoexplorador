// Panel para padres: PIN, indicadores A y B, guía, cartas de rol y resumen exportable.
import { estado, guardar, borrarTodo, hashPin, fecha } from './estado.js';
import { esc, activarTabs, tabsHTML } from './motor.js';

const prom = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
const dec = (x, d = 1) => x === null ? '—' : x.toFixed(d).replace('.', ',');

export function panelPadres(app, ctx) {
  const pintar = html => { app.innerHTML = html; window.scrollTo(0, 0); };

  function puerta() {
    const crear = !estado.ajustes.pin;
    pintar(`<section class="tarjeta">
      <h1>🔒 Panel para padres</h1>
      <p class="narr">${crear ? 'Cree un PIN de 4 dígitos. Se guarda solo en este dispositivo.' : 'Ingrese su PIN.'}</p>
      <label class="campo">PIN <input id="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></label>
      <p class="aviso" id="pin-aviso" aria-live="polite"></p>
      <div class="acciones"><button class="btn principal" id="entrar">${crear ? 'Crear PIN' : 'Entrar'}</button>
      <button class="btn" id="volver">Volver</button></div>
    </section>`);
    document.getElementById('volver').onclick = ctx.inicio;
    const entrar = async () => {
      const pin = document.getElementById('pin').value;
      const aviso = document.getElementById('pin-aviso');
      if (!/^\d{4}$/.test(pin)) { aviso.textContent = 'El PIN debe tener 4 dígitos.'; return; }
      const h = await hashPin(pin);
      if (crear) { estado.ajustes.pin = h; guardar(); panel(); }
      else if (h === estado.ajustes.pin) panel();
      else aviso.textContent = 'El PIN no coincide.';
    };
    document.getElementById('entrar').onclick = entrar;
    document.getElementById('pin').onkeydown = e => { if (e.key === 'Enter') entrar(); };
  }

  function indicadoresA() {
    const ps = estado.partidas.filter(p => p.foco.includes('A'));
    if (!ps.length) return '<p>Aún no hay sesiones del módulo de decodificación.</p>';
    return `<table><thead><tr><th>Fecha</th><th>Eligió el significado más probable</th><th>Pistas revisadas por frase</th><th>Certeza media</th><th>Caso ambiguo</th><th>Preguntas de verificación</th></tr></thead><tbody>${
      ps.map(p => {
        const claros = p.decod.filter(d => !d.ambiguo && d.acierto !== null);
        const amb = p.decod.find(d => d.ambiguo);
        return `<tr><td>${fecha(p.fecha)}</td>
          <td>${claros.filter(d => d.acierto).length} de ${claros.length}</td>
          <td>${dec(prom(p.decod.map(d => d.pistas)))}</td>
          <td>${dec(prom(claros.map(d => d.certeza)), 0)} %</td>
          <td>${amb ? (amb.verifico ? 'Preguntó' : `Certeza ${amb.certeza} %`) : '—'}</td>
          <td>${p.verificaciones}</td></tr>`;
      }).join('')}</tbody></table>
      <p class="pie">Lectura: importa menos «acertar» que revisar pistas antes de decidir, ajustar la certeza a la evidencia y preguntar cuando no alcanza. En el caso ambiguo, una certeza baja o haber preguntado son la mejor señal.</p>`;
  }

  function indicadoresB() {
    const ps = estado.partidas.filter(p => p.foco.includes('B'));
    if (!ps.length) return '<p>Aún no hay sesiones del módulo de conversación.</p>';
    return `<table><thead><tr><th>Fecha</th><th>Su parte de las palabras</th><th>Turnos (él / el otro)</th><th>Preguntas hechas</th><th>Herramientas usadas</th><th>Error del termómetro</th></tr></thead><tbody>${
      ps.map(p => {
        const tot = p.palabras.yo + p.palabras.otro || 1;
        const est = p.termo.filter(t => !t.pregunto);
        const preg = p.termo.filter(t => t.pregunto).length;
        const herr = [...new Set(p.herramientas)].map(h => ctx.contenido.herramientas[h]?.nombre).filter(Boolean);
        return `<tr><td>${fecha(p.fecha)}</td>
          <td>${Math.round(p.palabras.yo / tot * 100)} %</td>
          <td>${p.turnos.yo} / ${p.turnos.otro}</td>
          <td>${p.preguntas}</td>
          <td>${herr.map(esc).join(', ') || '—'}</td>
          <td>${est.length ? dec(prom(est.map(t => Math.abs(t.estimado - t.real)))) + ' pts' : '—'}${preg ? ` (preguntó ${preg})` : ''}</td></tr>`;
      }).join('')}</tbody></table>
      <p class="pie">Lectura: no existe un porcentaje ideal de palabras. Entre 30 % y 70 % la conversación suele sentirse pareja, pero depende de quién preguntó. Un error de termómetro de hasta 2 puntos es una buena estimación.</p>`;
  }

  function informe() {
    const mods = ctx.indice.modulos.map(m => {
      const ps = estado.partidas.filter(p => p.modulo === m.n);
      return `<tr><td>${m.n}. ${esc(m.nombre)}</td><td>${m.escenarios.length ? ps.length : 'Próximamente'}</td><td>${ps.length ? fecha(ps.at(-1).fecha) : '—'}</td></tr>`;
    }).join('');
    const comp = estado.leyes.filter(l => l.compartida);
    const m = estado.mision;
    return `<section class="informe">
      <h1>Cronoexplorador: resumen de ${esc(estado.perfil.nombre || 'sin nombre')}</h1>
      <p class="pie">Generado el ${fecha(new Date().toISOString())}. Datos guardados solo en este dispositivo.</p>
      <h2>Progreso por módulo</h2>
      <table><thead><tr><th>Módulo</th><th>Sesiones</th><th>Última</th></tr></thead><tbody>${mods}</tbody></table>
      <h2>A. Interpretación con el contexto</h2>${indicadoresA()}
      <h2>B. Reciprocidad en la conversación</h2>${indicadoresB()}
      <h2>Transferencia a la vida real</h2>
      <p>Misión actual: ${m ? `${esc(m.texto)} (desde el ${fecha(m.desde)})` : 'ninguna'}.</p>
      <p>Insignias «Lo intenté»: ${estado.insignias.length}.</p>
      ${estado.insignias.length ? `<ul>${estado.insignias.map(i => `<li>${fecha(i.fecha)}: ${esc(i.texto)} — dijo: «${esc(i.como)}»</li>`).join('')}</ul>` : ''}
      <h2>Leyes sociales que decidió compartir</h2>
      ${comp.length ? `<ul>${comp.map(l => `<li>«${esc(l.texto)}» (${fecha(l.fecha)})</li>`).join('')}</ul>` : '<p>Ninguna por ahora. La bitácora es privada salvo lo que el niño marca para compartir.</p>'}
    </section>`;
  }

  function panel(tab = 'resumen') {
    const guia = ['A', 'B'].map(k => {
      const g = ctx.contenido.guia_padres[k];
      return `<h3>${k}. ${esc(g.titulo)}</h3><ul>${g.puntos.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`;
    }).join('');
    const cartas = ctx.contenido.cartas_rol.map(c => `<article class="carta foco-${c.foco}">
      <h3>🎭 ${esc(c.titulo)} <span class="tipo">${c.foco === 'A' ? 'A · Interpretar' : 'B · Conversar'}</span></h3>
      <p><strong>Su rol:</strong> ${esc(c.adulto)}</p><p><strong>Qué practicar:</strong> ${esc(c.practica)}</p><p><strong>Tip:</strong> ${esc(c.tip)}</p>
    </article>`).join('');

    const ps = estado.partidas;
    const ult = ps.at(-1);
    pintar(`<div class="padres">
      <div class="cabecera-p no-imprimir"><h1>🔒 Panel para padres</h1><button class="btn" id="salir">Salir</button></div>
      <div class="botin no-imprimir">
        <div><span aria-hidden="true">🗺️</span><b>${ps.length}</b><small>Sesiones</small></div>
        <div><span aria-hidden="true">📖</span><b>${Object.keys(estado.glosario).length}</b><small>Expresiones</small></div>
        <div><span aria-hidden="true">🏅</span><b>${estado.insignias.length}</b><small>Insignias</small></div>
        <div><span aria-hidden="true">📅</span><b>${ult ? fecha(ult.fecha) : '—'}</b><small>Última sesión</small></div>
      </div>
      ${tabsHTML([['resumen', '📊 Resumen'], ['guia', '🏠 Guía'], ['cartas', '🎭 Cartas de rol'], ['ajustes', '⚙️ Ajustes']])}
      <p class="aviso no-imprimir" id="p-aviso" aria-live="polite"></p>
      <div class="tarjeta" data-panel="resumen">
        <div class="acciones no-imprimir arriba"><button class="btn principal" id="imprimir">Imprimir o guardar como PDF</button>
          <button class="btn" id="copiar">Copiar como texto</button></div>
        ${informe()}</div>
      <div class="tarjeta no-imprimir" data-panel="guia"><h2>Guía breve para la casa</h2>${guia}</div>
      <div class="tarjeta no-imprimir" data-panel="cartas"><h2>Cartas de rol</h2>
        <p class="pie">Cinco minutos, una carta por vez, y solo si el niño tiene ganas. Estas cartas son las que más ayudan a llevar lo aprendido a la vida real.</p>${cartas}</div>
      <div class="tarjeta no-imprimir" data-panel="ajustes"><h2>Ajustes</h2>
        <label class="campo">Nombre del niño o niña <input id="a-nom" type="text" maxlength="24" value="${esc(estado.perfil.nombre)}"></label>
        <label class="check"><input type="checkbox" id="a-dis" ${estado.ajustes.dislexia ? 'checked' : ''}> Usar fuente OpenDyslexic</label>
        <label class="campo">Nuevo PIN (4 dígitos) <input id="a-pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></label>
        <div class="acciones"><button class="btn principal" id="a-guardar">Guardar ajustes</button>
        <button class="btn peligro" id="a-borrar">Borrar todos los datos</button></div>
      </div>
    </div>`);

    activarTabs(app, tab);
    const aviso = document.getElementById('p-aviso');
    document.getElementById('salir').onclick = ctx.inicio;
    document.getElementById('imprimir').onclick = () => window.print();
    document.getElementById('copiar').onclick = async () => {
      const texto = app.querySelector('.informe').innerText;
      try { await navigator.clipboard.writeText(texto); aviso.textContent = 'Resumen copiado.'; }
      catch { aviso.textContent = 'No se pudo copiar. Use «Imprimir o guardar como PDF».'; }
    };
    document.getElementById('a-guardar').onclick = async () => {
      estado.perfil.nombre = document.getElementById('a-nom').value.trim();
      estado.ajustes.dislexia = document.getElementById('a-dis').checked;
      const pin = document.getElementById('a-pin').value;
      if (pin && !/^\d{4}$/.test(pin)) { aviso.textContent = 'El PIN nuevo debe tener 4 dígitos. No se guardó.'; window.scrollTo(0, 0); return; }
      if (pin) estado.ajustes.pin = await hashPin(pin);
      guardar();
      ctx.aplicarFuente();
      panel('ajustes');
      document.getElementById('p-aviso').textContent = 'Ajustes guardados.';
    };
    document.getElementById('a-borrar').onclick = () => {
      if (!confirm('Se borrarán el progreso, la bitácora y el PIN de este dispositivo. No se puede deshacer. ¿Continuar?')) return;
      borrarTodo();
      ctx.aplicarFuente();
      location.reload();
    };
  }

  puerta();
}
