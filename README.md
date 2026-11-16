# Cronoexplorador

Juego web de habilidades sociales: un cronoexplorador viaja con Krag, un amigo prehistórico literal, y le traduce las costumbres de los niños de hoy.

Estado: **MVP**. Incluye los módulos 2 (Biblioteca) y 3 (Base en Marte), la bitácora, la misión de la semana, las cartas de rol y el panel para padres.

## Probarlo en el computador

Una PWA no funciona abriendo `index.html` directo: necesita un servidor.

```bash
python -m http.server 8123
```

Después abre `http://localhost:8123`.

## Publicarlo en GitHub Pages

1. Crea un repositorio en GitHub y sube el contenido de esta carpeta.
2. En el repositorio: Settings → Pages → Source: «Deploy from a branch», rama `main`, carpeta `/ (root)`.
3. Abre la dirección que entrega GitHub en la tablet y elige «Agregar a pantalla de inicio».

Todas las rutas son relativas, así que funciona en `usuario.github.io/repositorio/`. Al publicar cambios, sube `VERSION` en `sw.js` y agrega ahí los escenarios nuevos.

## Privacidad

No hay cuentas, backend ni terceros. Todo se guarda en `localStorage` bajo la clave `cronoexplorador.v1`. El PIN se guarda como hash. La bitácora del niño es privada: el panel solo muestra las leyes que él marca para compartir.

## Fuente

`fuentes/OpenDyslexic-Regular.woff2` viene del repositorio oficial (github.com/antijingoist/opendyslexic) y se distribuye bajo la licencia SIL Open Font License 1.1. Se activa desde el panel para padres.

## Estructura

```
index.html · manifest.webmanifest · sw.js
css/estilos.css
js/app.js         pantallas y sesión de 5 etapas
js/motor.js       intérprete de escenarios
js/estado.js      localStorage
js/personajes.js  retratos SVG
js/padres.js      panel con PIN
escenarios/       indice.json + un JSON por escenario
contenido/        glosario, herramientas, misiones, cartas de rol, guía
fuentes/          OpenDyslexic-Regular.woff2 (opcional)
```

## Esquema de un escenario

```jsonc
{
  "id": "marte-01",
  "modulo": 3,
  "titulo": "La clave de la esclusa",
  "foco": ["A"],                       // "A" interpretación, "B" reciprocidad
  "sutileza": 1,                       // nivel de sutileza de las señales
  "escena": "marte",                   // fondo ilustrado: "marte", "biblioteca" o "cumple"
  "muro": "matilde",                   // opcional: muestra el muro de boulder de turnos con ese personaje
  "muro_nombre": "Los demás",          // opcional: nombre a mostrar en el muro cuando es un grupo
  "variables": { "interes": 6 },       // estado local del escenario
  "limites": { "interes": [0, 10] },   // opcional: mínimo y máximo de una variable
  "persistentes": ["amistad_matilde"], // variables que viajan a otros escenarios
  "inicio": "m0",
  "bitacora": { "invitacion": "…", "sugerencias": ["…"] },
  "nodos": { "m0": { /* ver abajo */ } }
}
```

### Campos comunes de cualquier nodo

| Campo | Uso |
|---|---|
| `tipo` | `narracion`, `dialogo`, `decision`, `decodificador`, `termometro`, `acertijo`, `grafico`, `fin` |
| `contexto`, `texto` | Párrafos del narrador |
| `habla`, `cara`, `frase` | Personaje, expresión y lo que dice. Caras: `neutral`, `sonrisa`, `molesta`, `sorpresa`, `pensando`, `aparte` |
| `krag`, `krag_cara` | Reacción de Krag y su expresión (por defecto `sorpresa`) |
| `nota` | Comentario destacado |
| `pistas` | Lista de `{ "canal", "texto" }`. Canales: `cara`, `tono`, `cuerpo`, `contexto`, `antes` |
| `palabras` | `{ "yo": n, "otro": n }`: palabras que suma el nodo al contador |
| `glosario` | Id de la expresión que se desbloquea |
| `siguiente` | Id del nodo siguiente, o lista `[{ "si": cond, "ir": id }, { "ir": id }]` |
| `variantes` | Lista de `{ "si": cond, …campos }`. La primera que se cumple reemplaza esos campos |

Una condición es `{ "var": "x", "op": ">=", "valor": 1 }` (operadores `>=`, `<=`, `>`, `<`, `!=`, `==`) o una lista de condiciones que deben cumplirse todas.

### Campos por tipo

**`decision`**: `pregunta` y `opciones`. Cada opción tiene:

- `texto`, `consecuencia` y `porque` (obligatorios).
- `pensamiento`: burbuja revelable.
- `efectos`: `{ "variable": cambio }`, se suma al valor actual.
- `palabras`, `siguiente`, `si`.
- `cara`: expresión del personaje después de elegir esta opción.
- `pregunta: true` si cuenta como pregunta al otro.
- `verificacion: true` si es una pregunta de verificación.
- `herramienta`: id de `contenido.json`.

No existe un campo «correcta»: cada opción tiene una consecuencia verosímil y su porqué.

**`decodificador`**: `significados` (lista de `{ "texto", "plausibilidad" }` entre 0 y 1), `explicacion`, `verificacion` (`{ "pregunta", "respuesta" }`) y `ambiguo: true` cuando las pistas no alcanzan (con `incierto` opcional: el texto que aparece si no se pregunta).

**`termometro`**: `sobre` (personaje), `pregunta`, `senales` (lista), `real` (número o nombre de variable), `explicacion` y `preguntar` (`{ "dices", "respuestas": [{ "max", "texto", "cara" }] }`).

**`acertijo`**: `enunciado`, `respuesta` (número), `pistas` (lista) y `explicacion`.

**`grafico`**: muestra palabras, turnos y preguntas acumulados.

## Agregar un escenario

1. Crea `escenarios/mi-escenario.json`.
2. Agrégalo en `escenarios/indice.json`, dentro del módulo que corresponda.
3. Agrégalo a `ARCHIVOS` en `sw.js` y sube `VERSION`.
4. Revísalo: ¿es neuroafirmativo?, ¿explica el porqué?, ¿evita la vergüenza?, ¿el contexto social es de 7-8 años y el desafío cognitivo de 9-11?

## Pendiente

- Módulos 1, 4, 5, 7 y 8.
- Dificultad adaptativa: el campo `sutileza` existe, pero aún hay un solo escenario por módulo.
- Sonido: el MVP no tiene sonido.
