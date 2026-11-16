// Estado del juego. Todo vive en localStorage, en una sola clave versionada.
const CLAVE = 'cronoexplorador.v1';

const base = () => ({
  version: 1,
  perfil: { nombre: '' },
  ajustes: { dislexia: false, pin: null },
  persistentes: {},   // variables que viajan entre escenarios
  glosario: {},       // id de expresión -> fecha en que se descifró
  herramientas: {},   // id de herramienta -> veces usada
  leyes: [],          // { texto, fecha, escenario, compartida }
  partidas: [],       // registro de cada escenario terminado
  mision: null,       // { id, texto, foco, desde }
  insignias: []       // { mision, texto, fecha, como }
});

function cargar() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE));
    if (d && d.version === 1) return Object.assign(base(), d);
  } catch { /* almacenamiento vacío o no disponible */ }
  return base();
}

export let estado = cargar();

export function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin espacio o modo privado */ }
}

export function borrarTodo() {
  try { localStorage.removeItem(CLAVE); } catch { /* nada que borrar */ }
  estado = base();
}

export async function hashPin(pin) {
  const datos = new TextEncoder().encode('crono:' + pin);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', datos);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return 'plano:' + pin; // contexto no seguro (http sin localhost)
}

export const hoy = () => new Date().toISOString();
export const fecha = iso => new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
