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
| LinkedIn      | Web pública (endpoint jobs-guest, sin login) | ✅ Funciona y trae ofertas muy relevantes. Ojo: si lo corres muchas veces seguidas te puede dar error 429 (LinkedIn limita peticiones). Para un par de corridas al día, va bien. |

## Comandos

```powershell
npm run buscar   # busca ofertas nuevas
npm run panel    # abre el panel para revisarlas
```

> Nota: si una página cambia su diseño, su scraper puede dejar de traer ofertas.
> No rompe nada — las demás siguen funcionando y solo hay que ajustar los
> selectores de esa página en `src/fuentes/`.
