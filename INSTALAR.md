# 📋 Cómo instalar y usar el Buscador de Chambitas

Guía paso a paso para dejarlo andando en tu PC, **aunque no sepas nada de
programación**. Son ~10 minutos la primera vez. Después, usarlo son 2 comandos.

> Esta guía es para **Windows**. Si usas Mac, mira la nota al final.

---

## 🟢 Paso 1 — Instalar Node.js (una sola vez)

Node es el "motor" que hace correr la app. Es lo único que necesitas instalar.

1. Entra a 👉 **https://nodejs.org**
2. Baja el botón grande que dice **"LTS"** (la versión recomendada).
3. Abre el archivo descargado y dale **Next → Next → Install** (todo por defecto).
4. Para comprobar que quedó: abre **PowerShell** (botón Inicio, escribe
   `powershell`, Enter) y escribe:
   ```powershell
   node --version
   ```
   Si te muestra un número (ej. `v20.x.x`), ¡listo! 🎉

---

## 🟢 Paso 2 — Descargar el proyecto

Tienes 2 opciones. La **A es la más fácil** si no conoces Git.

### Opción A — Descargar el ZIP (fácil)
1. Entra a la página del repositorio en GitHub.
2. Botón verde **`< > Code`** → **Download ZIP**.
3. Descomprime el ZIP donde quieras (ej. en `Documentos`).

### Opción B — Con Git (si lo tienes instalado)
```powershell
git clone https://github.com/Druguito/Buscador-de-chambitas.git
```

---

## 🟢 Paso 3 — Abrir PowerShell EN la carpeta del proyecto

Esto es clave: los comandos hay que escribirlos **dentro** de la carpeta.

1. Abre la carpeta del proyecto en el Explorador de archivos.
2. Haz clic en la **barra de dirección** de arriba (donde dice la ruta),
   borra lo que hay, escribe `powershell` y aprieta **Enter**.
3. Se abre una ventana negra ya ubicada en la carpeta. 👍

*(Alternativa: abres PowerShell y escribes `cd "ruta\de\la\carpeta"`)*

---

## 🟢 Paso 4 — Instalar las piezas del proyecto (una sola vez)

Dentro de esa ventana, escribe:
```powershell
npm install
```
Espera a que termine (baja las dependencias). Puede tardar 1-2 minutos.

---

## 🟢 Paso 5 — Configurar QUÉ trabajos buscas

1. En la carpeta hay un archivo llamado **`profile.example.yaml`**.
2. **Cópialo** y renombra la copia a **`profile.yaml`**.
   (O por PowerShell: `copy profile.example.yaml profile.yaml`)
3. Abre `profile.yaml` con el **Bloc de notas** (clic derecho → Abrir con) y edita:
   - `nombre`: tu nombre.
   - `busquedas`: los cargos/tecnologías que buscas (ej. `Enfermería`, `Contador`,
     `Diseñador`, lo que sea — no tiene que ser de programación).
   - `skills`: tus habilidades. Cada una que aparezca en una oferta la sube en la lista.
   - `evitar`: palabras para descartar ofertas que no quieres.
4. Guarda el archivo.

> 💡 No necesitas tocar nada más. Solo este archivo decide qué te aparece.

---

## 🟢 Paso 6 — ¡Usarlo!

Son **2 comandos**. Escríbelos en la misma ventana de PowerShell:

**1) Buscar ofertas nuevas:**
```powershell
npm run buscar
```
Entra a las páginas de empleo, filtra según tu perfil y guarda las nuevas.

**2) Abrir el panel para revisarlas:**
```powershell
npm run panel
```
Se abre solo en tu navegador. Ahí ves las ofertas y las marcas:
- **Postular** → abre el link de la oferta y la marca como postulada.
- **Guardar** → la dejas para después.
- **Descartar** → no te vuelve a aparecer.

> Deja esa ventana de PowerShell abierta mientras usas el panel.
> Para cerrarlo, vuelves a la ventana y aprietas **Ctrl + C**.

Y eso es todo. Cuando quieras ver si hay nuevas, corres `npm run buscar` otra vez. 🚀

---

## ❓ Problemas comunes

- **"npm no se reconoce como un comando"** → no quedó instalado Node (Paso 1) o no
  reiniciaste PowerShell. Cierra y abre PowerShell de nuevo.
- **"No encontré profile.yaml"** → te saltaste el Paso 5. Copia
  `profile.example.yaml` a `profile.yaml`.
- **No aparece ninguna oferta** → tus `busquedas`/`skills` son muy específicas, o
  `puntaje_minimo` está muy alto en `profile.yaml`. Bájalo a `1` y usa búsquedas
  más generales.
- **LinkedIn da error 429** → lo corriste muchas veces seguidas y LinkedIn te frenó
  un rato. Espera, o ponlo en `false` en `profile.yaml` (sección `fuentes`).

---

## 🍎 Nota para Mac

Casi igual. Cambian dos cosas:
1. En vez de PowerShell, usas la app **Terminal**.
2. El scraping usa un navegador. Si no tienes Chrome ni Edge, corre **una vez**:
   ```bash
   npx playwright install chromium
   ```

¿Dudas? Pregúntale a Matías 😄
