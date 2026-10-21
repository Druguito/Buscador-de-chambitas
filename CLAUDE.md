# CLAUDE.md — Contexto del proyecto para Claude

> Este archivo lo lee Claude Code automáticamente al abrir el proyecto.
> Sirve para que, en cualquier PC, entienda de una qué es esto y cómo trabajar.
> (Está en español porque el dueño trabaja en español.)

## Qué es este proyecto

**Buscador de Chambitas**: herramienta personal de línea de comandos para buscar
ofertas de empleo en varias páginas, filtrarlas por palabras clave según un perfil,
y llevar registro de a cuáles ya se postuló. Es para uso propio del dueño y de
amigos, no un producto comercial.

**Dueño:** Matías Pino. Ingeniero Civil Informático, Full Stack, en Chile. Stack real
(según su CV): PHP/Laravel, JavaScript, TypeScript, Node.js, Java, Python, MySQL,
PostgreSQL, HTML/CSS, Docker, Git, Scrum, APIs REST. (NO React.) Busca cargos
Backend / Full Stack, remoto o en Santiago; Concepción/Biobío también le sirve. Habla en español, estilo relajado ("bro", "hermano").
Prefiere que le expliquen las cosas y a veces quiere aprender a hacerlas él mismo
(ej. los comandos de Git) en vez de que se los haga automáticamente.

## Principios de diseño (IMPORTANTES — no romper esto)

Este proyecto nació de un plan sobre-diseñado (Clean Architecture + PostgreSQL +
Docker + API de Claude para scoring). **Se descartó a propósito por complejo.** Las
reglas ahora son:

- ❌ **SIN APIs de pago / SIN IA.** El matching es por palabras clave local. Nunca
  reintroducir `@anthropic-ai/sdk`, OpenAI, ni pedir API keys.
- ❌ **SIN base de datos.** Todo se guarda en `data/ofertas.json` (un archivo).
- ❌ **SIN Docker.**
- ❌ **SIN descargar navegador.** Playwright usa el Edge/Chrome ya instalado vía
  `channel` (msedge → chrome → chromium como fallback).
- ✅ Todo debe **correr fácil en Windows** con solo Node instalado. Simplicidad > todo.
- ✅ Config del usuario en español, sin tocar código (`profile.yaml`).

Si alguna vez se propone "mejorar" con IA, DB o Docker: **confirmar primero**, porque
va contra la decisión explícita del dueño.

## Cómo se usa

- `npm run buscar` → scrapea las fuentes, filtra por perfil, guarda las ofertas
  nuevas en `data/ofertas.json`.
- `npm run panel` → levanta un servidor HTTP local (puerto 4321) y abre una página
  web con las ofertas y botones Postular / Guardar / Descartar. El panel tiene
  buscador de texto y botón "⬇ Excel" (endpoint `/api/exportar`).
- `npm run exportar` → genera `data/ofertas.csv` (separador `;` + BOM para Excel es-CL,
  columnas N°/Título/Empresa/Fuente/Ubicación/Puntaje/Estado/¿Postulaste?/Link; sin
  descartadas). Código en `src/exportar.ts` (`generarCsv()`, reusado por el panel).

Config en `profile.yaml` (copiar desde `profile.example.yaml` la primera vez).

### Perfiles múltiples (tipo "por usuario")

Se puede tener más de un perfil, cada uno con su **propia lista de ofertas** (no se
mezclan). Se elige con `--perfil <nombre>`:

- `npm run buscar` → `profile.yaml` + `data/ofertas.json` (el default).
- `npm run buscar -- --perfil qa` → `profile.qa.yaml` + `data/ofertas.qa.json`.
- `npm run panel -- --perfil qa` → sirve solo esa lista.

El parseo del argumento vive en `src/args.ts` (`perfilArg()`), y tanto `perfil.ts`
como `store.ts` reciben el nombre para armar la ruta del archivo. El nombre se
sanea a `[a-z0-9_-]` (no se aceptan rutas ni símbolos raros). El panel corre en el
puerto fijo 4321, así que se usa **un panel a la vez** (no dos perfiles en paralelo).

## Estructura del código (`src/`)

- `buscar.ts` — orquestador de `npm run buscar`. Corre las fuentes activas, filtra, guarda.
- `panel.ts` — servidor HTTP local del panel; endpoints `/`, `/api/ofertas`, `/api/accion`.
- `html.ts` — genera el HTML del panel (todo inline, sin dependencias externas).
  Las pestañas se definen en `VISTAS`, cada una con un predicado `ok(oferta)` (no
  es un simple filtro por `estado`): las ofertas `nueva` se parten en **✨ Nuevas**
  (`puntaje >= UMBRAL_BUENAS`, hoy 3) y **📋 Otras nuevas** (el resto). Así no se
  descarta nada al buscar y la lista principal queda revisable. Hay un selector de
  orden (mejor calce / más recientes / título / empresa); en Postuladas "más
  recientes" usa `actualizada_en` (cuándo postuló), en el resto `encontrada_en`.
- `perfil.ts` — carga y valida `profile.yaml`.
- `match.ts` — el filtrado/scoring por palabras clave (sin IA). 3 filtros: `evitar`,
  `solo_remoto`, `puntaje_minimo`. En título las skills valen 2, en cuerpo 1.
  Las `skills` del perfil incluyen a propósito palabras de ROL (Desarrollador,
  Full Stack, Backend, Programador...), no solo tecnologías: muchos portales
  (Laborum, Computrabajo) muestran un resumen corto sin stack, y un aviso perfecto
  como "Desarrollador Full Stack Junior" sacaba 0 puntos y se botaba. Con las
  palabras de rol pasó de botar 48 de 90 a botar 0.
  **`evitar` mira SOLO el título del cargo** (a propósito): cuando revisaba todo el
  aviso botaba chambas buenas ("Desarrollador Back-end Junior") solo porque la
  descripción mencionaba de pasada "el área comercial". No volver a aplicarlo al cuerpo.
- `store.ts` — lee/escribe `data/ofertas.json`. El ID de cada oferta es un hash
  `sha1(fuente + url)`; una oferta es "nueva" si su ID no está aún en el archivo.
  Además hace **dedupe entre páginas**: `claveContenido()` = `título + empresa`
  normalizados (sin tildes/mayúsculas/símbolos); si esa huella ya existe, no se
  agrega aunque venga de otra fuente (la misma chamba en GetOnBoard y Trabajando
  se guarda una sola vez). Es dedupe hacia adelante: no borra lo ya guardado.
- `tipos.ts` — tipos compartidos.
- `fuentes/` — un scraper por página:
  - `getonboard.ts` — API pública JSON gratis. La más confiable.
  - `computrabajo.ts` — Playwright (selector `article.box_offer`). **Pagina** con `?p=2,3...`
    hasta `MAX_PAGINAS` (5 = ~100 por término) reusando UN navegador para todas las
    búsquedas. Sin paginar traía solo 20 por término y se perdía casi todo (una
    búsqueda como "desarrollador" tiene cientos de resultados).
    Dominio: usar el canónico `www.computrabajo.cl` (NO `cl.computrabajo.com` ni
    `www.computrabajo.com` fijos: cuál sirve depende de la red del usuario, y un host
    fijo da 404 en algunas). Los links de oferta se guardan sobre `.cl` y sin el
    fragmento `#lc=...`.
  - `chiletrabajos.ts` — Playwright. URL de búsqueda: `/empleos?q=` (la vieja
    `/trabajos?q=` ahora redirige a /404). OJO: su buscador **ignora la palabra
    clave** y trae rubros random (no-tech: soldador, psicólogo, etc.), así que para
    perfiles tech aporta ~0 (el filtro de skills los bota). Útil solo para perfiles
    no-técnicos. Card: título/link en `h2.title a`, empresa+ciudad en `h3.meta`.
  - `trabajando.ts` — Playwright. El sitio es Nuxt (ofertas renderizadas por JS),
    selector `div.result-box-container` (título en `h2 a`, empresa `.type`,
    ubicación `.location`, descripción `.description`). Busca en
    `/trabajo-empleo/<slug>`.
  - `trabajoorg.ts` — Playwright. Agregador `cl.trabajo.org` con muchísimas ofertas
    de todo Chile (lo que Google muestra en su widget). Navegar directo a la URL de
    resultados lo BLOQUEA (anti-bot); hay que **buscar vía formulario** (`sKeyword` +
    Enter) reusando un solo navegador para todas las búsquedas. Card: `li.job-item`
    con `data-url` (link), `h3` (título) y spans (ubicación/empresa/jornada).
  - `laborum.ts` — Playwright. Laborum (grupo Bumeran). Sus clases CSS son hashes de
    styled-components (`sc-gnEqpY`) que cambian en cada despliegue: NO anclarse a
    clases, sino a los links `/empleos/<slug>-<id>.html`. La tarjeta se lee por sus
    líneas de texto ([fecha, título, empresa, "Ciudad, Región", modalidad]); hay que
    filtrar badges ("Nuevo", "Destacado") o se cuelan como título. Pagina `?page=N`.
  - `bebee.ts` — Playwright. AGREGADOR (junta avisos de Laborum y otros portales),
    así que se solapa con las demás fuentes; el dedupe de `store.ts` lo maneja.
    Ventaja: trae descripción larga (~300 chars) en el listado, mucho mejor que
    Computrabajo (118) o LinkedIn (43), así que matchea más skills. Links de oferta
    llevan el marcador `--ss-cl-`. Pagina con `&page=N` (`&p=N` NO sirve, repite la 1).
    La tarjeta a veces viene SIN ciudad, y ahí la empresa se colaba como ubicación:
    por eso se detecta si la 2ª línea es un lugar chileno antes de asignarla.
  - `linkedin.ts` — endpoint público `jobs-guest` vía fetch (sin login). **Pagina**
    `start=0,25,50...` hasta `MAX_PAGINAS` (4 = ~100 por término). Si LinkedIn tira
    429, guarda lo que alcanzó y corta (no insiste). NUNCA usar login/credenciales:
    LinkedIn banea cuentas automatizadas (el dueño lo ofreció; se rechazó a propósito).
    Las descripciones vienen "peladas" (solo título), por eso muchas se filtran.
  - `navegador.ts` — helper que abre Edge/Chrome instalado.

## Estados de una oferta

`nueva` → `guardada` / `postulada` / `descartada`. Nunca se borran del archivo; solo
cambia el campo `estado`. Por eso lo postulado/descartado no reaparece en "Nuevas" ni
se re-agrega en la próxima búsqueda (su ID ya existe).

## Cosas frágiles / gotchas

- Los scrapers con navegador dependen del HTML de cada sitio. Si un sitio cambia su
  diseño, su scraper deja de traer ofertas (devuelve `[]` y avisa, no rompe el resto).
  Se arregla ajustando selectores en `src/fuentes/<sitio>.ts`.
- `data/ofertas.json` y `profile.yaml` están en `.gitignore` (datos personales, no se
  suben). En cada PC la "memoria de vistas" es local y no se sincroniza.
- El `empresa` de Computrabajo se saca de `p.fs16 a` (NO de `.fc_base`: el <a> del
  título lleva esa misma clase y se guardaba el título como empresa; ya arreglado).
- Una fuente solo corre si su clave está en `profile.yaml → fuentes` (ej. `trabajando:
  true`). Si falta la clave, `buscar` la salta en silencio (por eso Trabajando daba 0
  hasta que se agregó la línea). El `profile.example.yaml` las lista todas.
- Requiere Node 18+ (usa `fetch` global).

## Estado actual

Funciona de punta a punta con las 5 fuentes activas. Verificado con corridas reales.
Stack: Node + TypeScript + ts-node + Playwright + js-yaml. ~26 paquetes npm.

## Ideas pendientes (si se retoma)

- Agendar `npm run buscar` con el Programador de tareas de Windows.
- Respaldo automático de `data/ofertas.json`.
- Arreglar el `empresa` duplicado de Computrabajo.
