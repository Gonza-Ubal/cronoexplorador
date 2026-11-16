// Service worker: precachea todo para jugar sin conexión.
// Estrategia: red primero (para recibir actualizaciones) y caché si no hay conexión.
// Al publicar cambios, sube el número de VERSION.
const VERSION = 'crono-v4';
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/estilos.css',
  'js/app.js', 'js/estado.js', 'js/motor.js', 'js/personajes.js', 'js/padres.js',
  'escenarios/indice.json', 'escenarios/biblioteca-01.json', 'escenarios/marte-01.json', 'escenarios/cumple-01.json',
  'contenido/contenido.json',
  'iconos/icono-192.png', 'iconos/icono-512.png',
  'fuentes/OpenDyslexic-Regular.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    // Uno por uno: si falta un archivo opcional (la fuente), el resto igual se guarda.
    .then(c => Promise.all(ARCHIVOS.map(a => c.add(a).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
