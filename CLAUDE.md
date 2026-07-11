# CLAUDE.md — Contexto del proyecto para Claude

> Este archivo lo lee Claude Code automáticamente al abrir el proyecto.
> Sirve para que, en cualquier PC, entienda de una qué es esto y cómo trabajar.
> (Está en español porque el dueño trabaja en español.)

## Qué es este proyecto

**Buscador de Chambitas**: herramienta personal de línea de comandos para buscar
ofertas de empleo en varias páginas, filtrarlas por palabras clave según un perfil,
y llevar registro de a cuáles ya se postuló. Es para uso propio del dueño y de
amigos, no un producto comercial.

**Dueño:** Matías Pino. Desarrollador en Chile. Stack: PHP, Laravel, PostgreSQL,
MySQL, React, TypeScript, Node.js, Docker. Busca cargos Backend / Full Stack,
remoto o en Santiago/Chile. Habla en español, estilo relajado ("bro", "hermano").
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
  web con las ofertas y botones Postular / Guardar / Descartar.

Config en `profile.yaml` (copiar desde `profile.example.yaml` la primera vez).

## Estructura del código (`src/`)

- `buscar.ts` — orquestador de `npm run buscar`. Corre las fuentes activas, filtra, guarda.
- `panel.ts` — servidor HTTP local del panel; endpoints `/`, `/api/ofertas`, `/api/accion`.
- `html.ts` — genera el HTML del panel (todo inline, sin dependencias externas).
- `perfil.ts` — carga y valida `profile.yaml`.
- `match.ts` — el filtrado/scoring por palabras clave (sin IA). 3 filtros: `evitar`,
  `solo_remoto`, `puntaje_minimo`. En título las skills valen 2, en cuerpo 1.
- `store.ts` — lee/escribe `data/ofertas.json`. El ID de cada oferta es un hash
  `sha1(fuente + url)`; una oferta es "nueva" si su ID no está aún en el archivo.
- `tipos.ts` — tipos compartidos.
- `fuentes/` — un scraper por página:
  - `getonboard.ts` — API pública JSON gratis. La más confiable.
  - `computrabajo.ts` — Playwright (selector `article.box_offer`). Funciona.
  - `chiletrabajos.ts` — Playwright. Trae resultados pero su buscador es impreciso;
    el filtro de palabras clave limpia el ruido.
  - `linkedin.ts` — endpoint público `jobs-guest` vía fetch (sin login). Funciona
    bien pero LinkedIn tira 429 si se corre muchas veces seguidas.
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
- El campo `empresa` de Computrabajo a veces repite el título (selector impreciso, sin
  arreglar aún).
- Requiere Node 18+ (usa `fetch` global).

## Estado actual

Funciona de punta a punta con las 4 fuentes activas. Verificado con corridas reales.
Stack: Node + TypeScript + ts-node + Playwright + js-yaml. ~26 paquetes npm.

## Ideas pendientes (si se retoma)

- Agendar `npm run buscar` con el Programador de tareas de Windows.
- Respaldo automático de `data/ofertas.json`.
- Arreglar el `empresa` duplicado de Computrabajo.
