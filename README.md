# 💼 Job Hunter — buscador personal de chambas

Busca ofertas de empleo en varias páginas, las filtra según tu perfil y te deja
marcar cuáles ya postulaste. **Sin APIs de pago, sin base de datos, sin Docker.**

## Cómo funciona

1. `npm run buscar` → entra a las páginas, trae ofertas, las filtra por tus
   palabras clave y guarda las **nuevas** en `data/ofertas.json`.
2. `npm run panel` → abre una página web local donde ves las ofertas y las
   marcas: **Postular** (abre el link y la marca como postulada), **Guardar** o
   **Descartar**. Lo que descartas o postulas no vuelve a salir en "Nuevas".

Corres `buscar` cada cierto tiempo y solo te aparecen las que no habías visto.

## Instalar (una sola vez)

```powershell
.\scripts\setup.ps1
```

Eso instala dependencias y crea tu `profile.yaml`. No descarga ningún navegador:
usa el **Edge o Chrome** que ya tienes en Windows.

## Configurar qué buscas

Edita **`profile.yaml`** (no necesitas tocar código):

- `busquedas`: los cargos/tecnologías a buscar (Laravel, PHP, Backend…).
- `skills`: cada una que aparezca en una oferta le suma puntaje.
- `evitar`: palabras que descartan una oferta automáticamente.
- `puntaje_minimo`: cuántas skills debe tener al menos para guardarla.
- `fuentes`: prende/apaga cada página (`true`/`false`).

## Fuentes

| Página        | Cómo    | Estado                                              |
|---------------|---------|-----------------------------------------------------|
| GetOnBoard    | API     | ✅ La más confiable (tech/remoto).                  |
| Computrabajo  | Navegador | ✅ Funciona (mucha oferta en Chile).              |
| ChileTrabajos | Navegador | ⚠️ Funciona pero su buscador es impreciso; el filtro limpia el ruido. |
| Trabajando.com | Navegador | ✅ Funciona (oferta local en Chile).             |
| Trabajo.org   | Navegador | ✅ Agregador con mucha oferta de todo Chile. Hay que buscar por su formulario (bloquea la URL directa). |
| Laborum       | Navegador | ✅ Funciona (grupo Bumeran).                      |
| beBee         | Navegador | ✅ Agregador. Es el que trae descripciones más largas, así que matchea mejor. |
| LinkedIn      | Web pública (endpoint jobs-guest, sin login) | ✅ Funciona y trae ofertas muy relevantes. Ojo: si lo corres muchas veces seguidas te puede dar error 429 (LinkedIn limita peticiones). Para un par de corridas al día, va bien. |

> **Facebook Marketplace / login en LinkedIn:** descartados a propósito. No tienen
> puerta pública y habría que usar tu cuenta real, que esas plataformas banean si
> detectan automatización. Si un portal solo funciona con login, no se usa.

## Tests

```powershell
npm test
```

Cubren lo que no depende de internet: el filtrado y puntaje (`match.ts`) y el
guardado/deduplicación (`store.ts`). No tocan tu lista real — usan un perfil
`__test` aparte. Corren solos en cada push con GitHub Actions.

## Perfiles múltiples (opcional, tipo "por usuario")

Puedes tener varios perfiles, **cada uno con su propia lista** de ofertas (no se
mezclan entre sí). Útil para separar búsquedas (ej. "Backend" vs "QA") o para un
amigo. Se elige con `--perfil <nombre>`:

```powershell
# Perfil por defecto (como siempre): profile.yaml → data/ofertas.json
npm run buscar
npm run panel

# Otro perfil llamado "qa": profile.qa.yaml → data/ofertas.qa.json
npm run buscar -- --perfil qa
npm run panel -- --perfil qa
```

Para crear un perfil nuevo, copia `profile.example.yaml` a `profile.qa.yaml`
(o el nombre que quieras) y edítalo. La primera vez que corras `buscar` con ese
perfil, se crea su `data/ofertas.<nombre>.json` solo. Cambiar las skills de un
perfil **no toca** las listas de los otros.

> El panel usa el puerto fijo 4321, así que revisa **un perfil a la vez**.

## Comandos

```powershell
npm run buscar   # busca ofertas nuevas (perfil por defecto)
npm run panel    # abre el panel para revisarlas

npm run buscar -- --perfil <nombre>   # usa profile.<nombre>.yaml
npm run panel  -- --perfil <nombre>   # revisa esa lista aparte
```

> Nota: si una página cambia su diseño, su scraper puede dejar de traer ofertas.
> No rompe nada — las demás siguen funcionando y solo hay que ajustar los
> selectores de esa página en `src/fuentes/`.
