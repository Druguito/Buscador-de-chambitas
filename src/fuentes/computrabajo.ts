import { Page } from 'playwright';
import { OfertaCruda } from '../tipos';
import { conNavegador } from './navegador';

// Computrabajo Chile. No tiene API pública, así que leemos el HTML del listado.
// OJO dominio (tema fregado): Computrabajo sirve cada oferta en un host según la
// ubicación del que la abre, y no hay uno único que sirva a todos:
//   - BASE (búsqueda): `www.computrabajo.cl` → redirige al host que devuelva ofertas
//     al correr el scraper.
//   - HOST_OFERTA (link guardado): `cl.computrabajo.com` (el dueño confirmó que ese
//     host le abre bien las ofertas; es también el que responde 200 en pruebas).
//     Nota: el acceso a Computrabajo desde su red ha sido inestable; si el link
//     vuelve a fallar, el panel tiene un botón "🔍 Google" como salvavidas.
// Los selectores pueden cambiar; si el sitio los cambia, esto devuelve [] y avisa.
const BASE = 'https://www.computrabajo.cl';
const HOST_OFERTA = 'https://cl.computrabajo.com';

// El listado trae ~20 ofertas por página y pagina con `?p=2`, `?p=3`...
// Una búsqueda como "desarrollador" tiene cientos de resultados, así que sin
// paginar nos perdíamos casi todo. 5 páginas ≈ 100 ofertas por término.
const MAX_PAGINAS = 30;

function slug(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, '-');
}

// Lee UNA página del listado (pagina 1 = sin parámetro).
async function leerPagina(page: Page, query: string, pagina: number): Promise<OfertaCruda[]> {
  const url = `${BASE}/trabajo-de-${encodeURIComponent(slug(query))}` + (pagina > 1 ? `?p=${pagina}` : '');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Cada oferta es un artículo con clase que empieza con "box_offer".
  await page.waitForSelector('article.box_offer', { timeout: 12000 }).catch(() => {});

  return page.$$eval('article.box_offer', (nodos, hostOferta) => {
    return nodos.map((n) => {
      const a = n.querySelector('h2 a, a.js-o-link') as HTMLAnchorElement | null;
      const limpio = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim();

      // OJO: NO usar `.fc_base` para la empresa: el <a> del título también lleva
      // esa clase y terminábamos guardando el título como empresa.
      // La tarjeta trae dos <p class="fs16">: el 1º con "4,2 NombreEmpresa"
      // (rating + link a la empresa) y el 2º con la ubicación.
      const parrafos = Array.from(n.querySelectorAll('p.fs16'));
      let empresa = limpio(n.querySelector('p.fs16 a, a[href*="/empresas/"]')?.textContent);
      if (!empresa && parrafos[0]) {
        // sin link: quitamos el rating tipo "4,2 " del inicio
        empresa = limpio(parrafos[0].textContent).replace(/^\d+[,.]\d+\s*/, '');
      }
      // Ubicación: el párrafo que NO es el de la empresa (no tiene link).
      const ubic =
        limpio(parrafos.find((p) => !p.querySelector('a') && p.textContent?.includes(','))?.textContent) ||
        limpio(parrafos[1]?.textContent);

      // Descripción: algún párrafo que no sea empresa ni ubicación.
      const desc =
        limpio(n.querySelector('div.fc_aux, p.fs13, p.mtB')?.textContent) ||
        limpio(
          Array.from(n.querySelectorAll('p'))
            .map((p) => limpio(p.textContent))
            .find((t) => t && t !== ubic && !t.includes(empresa) && t.length > 25)
        );
      const href = a?.getAttribute('href') ?? '';
      // Nos quedamos solo con la RUTA de la oferta (sin importar el host del href)
      // y la montamos sobre HOST_OFERTA, sin el fragmento #lc=...
      const ruta = (href.startsWith('http') ? href.replace(/^https?:\/\/[^/]+/, '') : href).split('#')[0];
      const url = hostOferta + ruta;
      return {
        fuente: 'computrabajo',
        titulo: a?.textContent?.trim() ?? '',
        empresa: empresa || 'Empresa no informada',
        ubicacion: ubic || 'Chile',
        remoto: /remoto|teletrabajo|home ?office/i.test(`${ubic} ${desc}`),
        url,
        salario: '',
        descripcion: desc,
        tags: [],
      };
    });
  }, HOST_OFERTA);
}

export async function scrapeComputrabajo(busquedas: string[]): Promise<OfertaCruda[]> {
  const porUrl = new Map<string, OfertaCruda>();
  try {
    // Un solo navegador para todas las búsquedas y páginas (abrir uno por término
    // era mucho más lento).
    await conNavegador(async (page) => {
      for (const q of busquedas) {
        for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
          try {
            const ofertas = await leerPagina(page, q, pagina);
            if (ofertas.length === 0) break; // no hay más páginas
            let nuevasEnPagina = 0;
            for (const o of ofertas) {
              if (!o.url || !o.titulo) continue;
              if (!porUrl.has(o.url)) nuevasEnPagina++;
              porUrl.set(o.url, o);
            }
            // Si la página no aportó nada nuevo, ya estamos dando vueltas: cortamos.
            if (nuevasEnPagina === 0) break;
          } catch (e: any) {
            console.warn(`   ⚠ Computrabajo falló con "${q}" (pág ${pagina}): ${e.message}`);
            break;
          }
        }
      }
    });
  } catch (e: any) {
    console.warn(`   ⚠ Computrabajo no pudo abrir el navegador: ${e.message}`);
  }
  return [...porUrl.values()];
}
