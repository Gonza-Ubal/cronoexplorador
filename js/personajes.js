// Retratos SVG originales, generados por código. Sin recursos externos.
export const PERSONAJES = {
  krag:    { nombre: 'Krag',       piel: '#c98a5e', pelo: '#3b2a1e', estilo: 'revuelto', fondo: '#e9dcc3' },
  ignacia: { nombre: 'Ignacia',    piel: '#e8b48c', pelo: '#2b1d14', estilo: 'trenzas',  fondo: '#f1d9d0' },
  amaru:   { nombre: 'Amaru',      piel: '#b9774a', pelo: '#16110d', estilo: 'corto',    fondo: '#d6e4e1' },
  rosa:    { nombre: 'Tía Rosa',   piel: '#d9a07a', pelo: '#7a3b2e', estilo: 'mono',     fondo: '#e6dcec' },
  matilde: { nombre: 'Matilde',    piel: '#f0c6a2', pelo: '#8a4b22', estilo: 'melena',   fondo: '#d9e6d3' },
  hernan:  { nombre: 'Don Hernán', piel: '#c9966f', pelo: '#9a9a9a', estilo: 'calvo',    fondo: '#dde3ea', lentes: true },
  tomas:   { nombre: 'Tomás',      piel: '#e3b08a', pelo: '#a8703a', estilo: 'corto',    fondo: '#dbe6ef' },
  benja:   { nombre: 'Benja',      piel: '#a86a42', pelo: '#1d1612', estilo: 'rizos',    fondo: '#efe2c9' },
  mama:    { nombre: 'Mamá de Tomás', piel: '#e0aa84', pelo: '#5a3320', estilo: 'melena', fondo: '#e9dde4' }
};

const CASCO = 'M20 54 Q18 20 50 20 Q82 20 80 54 Q72 36 50 36 Q28 36 20 54Z';

function pelo(p) {
  const c = p.pelo;
  switch (p.estilo) {
    case 'revuelto': return `<path fill="${c}" d="M18 56 L14 38 L24 42 L22 22 L34 32 L38 12 L48 28 L58 10 L62 30 L76 18 L74 38 L86 36 L82 56 Q72 36 50 36 Q28 36 18 56Z"/>`;
    case 'trenzas':  return `<path fill="${c}" d="${CASCO}"/><rect fill="${c}" x="13" y="52" width="9" height="34" rx="4.5"/><rect fill="${c}" x="78" y="52" width="9" height="34" rx="4.5"/>`;
    case 'mono':     return `<circle fill="${c}" cx="50" cy="16" r="10"/><path fill="${c}" d="${CASCO}"/>`;
    case 'melena':   return `<path fill="${c}" d="M14 88 Q10 18 50 18 Q90 18 86 88 L74 88 L74 52 Q66 38 50 38 Q34 38 26 52 L26 88Z"/>`;
    case 'rizos':    return [[24, 40, 11], [34, 28, 12], [50, 23, 13], [66, 28, 12], [76, 40, 11], [20, 54, 8], [80, 54, 8]]
      .map(([x, y, r]) => `<circle fill="${c}" cx="${x}" cy="${y}" r="${r}"/>`).join('');
    case 'calvo':   return `<path fill="${c}" d="M20 58 Q16 44 24 36 L26 56Z M80 58 Q84 44 76 36 L74 56Z"/>`;
    default:         return `<path fill="${c}" d="${CASCO}"/>`;
  }
}

function rasgos(cara) {
  const t = '#2a2320';
  const dx = cara === 'aparte' ? 5 : 0;
  const dy = cara === 'pensando' ? -3 : 0;
  let ojos = `<circle cx="${39 + dx}" cy="${54 + dy}" r="3.4" fill="${t}"/><circle cx="${61 + dx}" cy="${54 + dy}" r="3.4" fill="${t}"/>`;
  let cejas = '', boca = '';
  const l = (d) => `<path d="${d}" stroke="${t}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  switch (cara) {
    case 'sonrisa':  cejas = l('M33 45 Q39 42 45 45') + l('M55 45 Q61 42 67 45'); boca = l('M38 67 Q50 79 62 67'); break;
    case 'molesta':  cejas = l('M32 42 L46 48') + l('M68 42 L54 48');             boca = l('M40 72 Q50 64 60 72'); break;
    case 'sorpresa': cejas = l('M33 41 Q39 37 45 41') + l('M55 41 Q61 37 67 41'); boca = `<ellipse cx="50" cy="70" rx="5" ry="6.5" fill="${t}"/>`; break;
    case 'pensando': cejas = l('M33 44 L45 42') + l('M55 40 Q61 37 67 41');       boca = l('M44 70 L58 68'); break;
    case 'aparte':   cejas = l('M34 45 L46 45') + l('M56 45 L68 45');             boca = l('M43 70 L57 70'); break;
    default:         cejas = l('M34 45 L46 45') + l('M56 45 L68 45');             boca = l('M42 69 Q50 72 58 69');
  }
  return ojos + cejas + boca;
}

const ROPA = { krag: '#8a6a45', ignacia: '#d97b5a', amaru: '#4f7fa3', rosa: '#6c8f6b', matilde: '#c9a227', hernan: '#6b7280', tomas: '#b5533c', benja: '#3f7d6e', mama: '#7b6a9c' };

export const NOMBRE_CARA = { sonrisa: 'sonriendo', molesta: 'con el ceño fruncido', sorpresa: 'con cara de sorpresa', pensando: 'pensando', aparte: 'mirando hacia otro lado', neutral: 'con cara tranquila' };

// Personaje de medio cuerpo para las escenas. La postura también da pistas.
export function figura(id, cara = 'neutral', x = 0, y = 0, s = 1) {
  const p = PERSONAJES[id];
  if (!p) return '';
  const ropa = ROPA[id] || '#7a8794';
  const brazo = d => `<path d="${d}" stroke="${p.piel}" stroke-width="10" stroke-linecap="round" fill="none"/>`;
  let brazos = '';
  if (cara === 'molesta') brazos = brazo('M30 126 L66 136') + brazo('M70 126 L34 136');
  else if (cara === 'pensando') brazos = brazo('M74 150 L66 96');
  else if (cara === 'sorpresa') brazos = brazo('M20 132 L10 108') + brazo('M80 132 L90 108');
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M18 170 Q16 98 50 94 Q84 98 82 170Z" fill="${ropa}"/>
    <rect x="43" y="78" width="14" height="22" fill="${p.piel}"/>
    ${cabeza(id, cara)}${brazos}
  </g>`;
}

function cabeza(id, cara) {
  const p = PERSONAJES[id];
  const atras = p.estilo === 'melena' ? pelo(p) : '';
  const adelante = p.estilo === 'melena' ? `<path fill="${p.pelo}" d="M24 50 Q30 30 50 30 Q70 30 76 50 Q64 40 50 42 Q36 40 24 50Z"/>` : pelo(p);
  const lentes = p.lentes ? `<g fill="none" stroke="#2a2320" stroke-width="2"><circle cx="39" cy="54" r="8"/><circle cx="61" cy="54" r="8"/><path d="M47 54 L53 54"/></g>` : '';
  const marca = id === 'krag' ? `<path d="M26 62 L34 64 M27 67 L34 69" stroke="#b5431c" stroke-width="3" stroke-linecap="round"/>
    <rect x="38" y="92" width="24" height="7" rx="3.5" fill="#f3ecdc" stroke="#8a7a5c" stroke-width="1"/>
    <path d="M44 93 V98 M48 93 V98 M52 93 V98 M56 93 V98" stroke="#8a7a5c" stroke-width="1"/>` : '';
  return `${atras}<circle cx="50" cy="56" r="30" fill="${p.piel}"/>${adelante}${rasgos(cara)}${lentes}${marca}`;
}

// Fondos de escena (400 x 230). "atras" va detrás de los personajes y "frente" delante.
const libros = () => {
  const col = ['#b98b6b', '#8fa7a3', '#c2a878', '#9d8fb0', '#a8b58c', '#c79a8a'];
  let s = '';
  for (let f = 0; f < 3; f++) {
    let x = 6, i = f * 5;
    while (x < 394) {
      const w = 9 + (i * 7) % 8, h = 34 + (i * 11) % 16;
      s += `<rect x="${x}" y="${20 + f * 62 + (52 - h)}" width="${w}" height="${h}" fill="${col[i % col.length]}"/>`;
      x += w + 2; i++;
    }
    s += `<rect x="0" y="${72 + f * 62}" width="400" height="6" fill="#a58a66"/>`;
  }
  return s;
};
const RELOJ = '<circle cx="40" cy="34" r="15" fill="#fffdf8" stroke="#6b7785" stroke-width="3"/><path d="M40 24 V34 L47 38" stroke="#6b7785" stroke-width="3" stroke-linecap="round" fill="none"/>';
export const FONDOS = {
  marte: {
    atras: `<rect width="400" height="230" fill="#dfe3e8"/>
      <clipPath id="ventana"><rect x="104" y="16" width="192" height="116" rx="20"/></clipPath>
      <g clip-path="url(#ventana)"><rect x="104" y="16" width="192" height="116" fill="#f0b79a"/>
        <circle cx="258" cy="44" r="9" fill="#fbe6cf"/>
        <path d="M104 104 Q150 66 200 98 T296 84 V132 H104Z" fill="#c4634a"/>
        <path d="M104 118 Q170 98 230 118 T296 110 V132 H104Z" fill="#96432f"/>
        <path d="M150 112 a12 12 0 0 1 24 0Z" fill="#eef1f4" stroke="#8b96a3" stroke-width="2"/></g>
      <rect x="104" y="16" width="192" height="116" rx="20" fill="none" stroke="#8b96a3" stroke-width="6"/>
      <path d="M0 150 H400" stroke="#c5ccd4" stroke-width="2"/>
      <rect x="322" y="26" width="52" height="34" rx="6" fill="#22303c"/><path d="M330 46 l8 -8 l8 10 l8 -14 l8 8" stroke="#7fd1c1" stroke-width="2" fill="none"/>${RELOJ}`,
    frente: '<rect y="196" width="400" height="34" fill="#aab4bf"/><rect y="196" width="400" height="5" fill="#8b96a3"/>'
  },
  biblioteca: {
    atras: `<rect width="400" height="230" fill="#efe6d6"/><g opacity=".55">${libros()}</g>${RELOJ}`,
    frente: '<rect y="196" width="400" height="34" fill="#a67c52"/><rect y="196" width="400" height="5" fill="#8a6440"/><rect x="170" y="184" width="46" height="12" rx="2" fill="#2f6f73"/><rect x="176" y="178" width="46" height="8" rx="2" fill="#b5533c"/>'
  },
  cumple: {
    atras: `<rect width="400" height="230" fill="#f3e7d3"/>
      <path d="M0 150 H400" stroke="#e2d3b8" stroke-width="2"/>
      <path d="M0 14 Q200 52 400 14" stroke="#8a7a5c" stroke-width="2" fill="none"/>
      ${[[70, 25], [118, 31], [166, 35], [214, 36], [262, 34], [310, 28], [356, 22]].map(([x, y], i) =>
        `<path d="M${x - 14} ${y - 2} L${x + 14} ${y + 1} L${x} ${y + 26}Z" fill="${['#c98b74', '#8fb0aa', '#d9bd72', '#a493b8'][i % 4]}"/>`).join('')}
      <path d="M188 150 Q186 110 180 92 M200 150 V86 M212 150 Q214 112 222 96" stroke="#8a7a5c" stroke-width="1.5" fill="none"/>
      <ellipse cx="178" cy="76" rx="15" ry="19" fill="#c98b74"/><ellipse cx="200" cy="68" rx="15" ry="19" fill="#8fb0aa"/><ellipse cx="224" cy="80" rx="15" ry="19" fill="#d9bd72"/>${RELOJ}`,
    frente: `<rect y="196" width="400" height="34" fill="#d8c6a2"/><rect y="196" width="400" height="5" fill="#b9a47c"/>
      <rect x="172" y="172" width="58" height="26" rx="4" fill="#f6e9dc" stroke="#b98b6b" stroke-width="2"/>
      <path d="M172 182 q7 7 14.5 0 t14.5 0 t14.5 0 t14.5 0" stroke="#c98b74" stroke-width="3" fill="none"/>
      <path d="M186 172 V160 M201 172 V158 M216 172 V160" stroke="#8fb0aa" stroke-width="3"/>
      <circle cx="186" cy="157" r="3" fill="#e9a15b"/><circle cx="201" cy="155" r="3" fill="#e9a15b"/><circle cx="216" cy="157" r="3" fill="#e9a15b"/>`
  },
  base: { atras: '<rect width="400" height="230" fill="#e9e4d8"/>' + RELOJ, frente: '<rect y="196" width="400" height="34" fill="#c9c2b4"/>' }
};

export function avatar(id, cara = 'neutral', tam = 76) {
  const p = PERSONAJES[id];
  if (!p) return '';
  const atras = p.estilo === 'melena' ? pelo(p) : '';
  const adelante = p.estilo === 'melena' ? `<path fill="${p.pelo}" d="M24 50 Q30 30 50 30 Q70 30 76 50 Q64 40 50 42 Q36 40 24 50Z"/>` : pelo(p);
  const lentes = p.lentes ? `<g fill="none" stroke="#2a2320" stroke-width="2"><circle cx="39" cy="54" r="8"/><circle cx="61" cy="54" r="8"/><path d="M47 54 L53 54"/></g>` : '';
  const krag = id === 'krag'
    ? `<path d="M26 62 L34 64 M27 67 L34 69" stroke="#b5431c" stroke-width="3" stroke-linecap="round"/>
       <rect x="38" y="90" width="24" height="7" rx="3.5" fill="#f3ecdc" stroke="#8a7a5c" stroke-width="1"/>
       <path d="M44 91 V96 M48 91 V96 M52 91 V96 M56 91 V96" stroke="#8a7a5c" stroke-width="1"/>`
    : '';
  return `<svg class="avatar" width="${tam}" height="${tam}" viewBox="0 0 100 100" role="img" aria-label="${p.nombre}, ${NOMBRE_CARA[cara] || NOMBRE_CARA.neutral}">
    <circle cx="50" cy="50" r="50" fill="${p.fondo}"/>
    ${atras}
    <circle cx="50" cy="56" r="30" fill="${p.piel}"/>
    ${adelante}${rasgos(cara)}${lentes}${krag}
  </svg>`;
}
