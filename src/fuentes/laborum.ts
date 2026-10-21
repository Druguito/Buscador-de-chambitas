import { OfertaCruda } from '../tipos';
import { conNavegador } from './navegador';
import { Page } from 'playwright';

// Laborum Chile (grupo Bumeran). Sin API pública: leemos el listado con navegador.
// OJO: sus clases CSS son hashes autogenerados (styled-components: `sc-gnEqpY`...)
// que cambian en cada despliegue del sitio. Por eso NO nos anclamos a clases, sino
// a los enlaces de oferta `/empleos/<slug>-<id>.html`, que son estables.
// Cada tarjeta muestra sus datos en líneas:
//   ["Actualizado hace 5 días", "Título", "Empresa", "Ciudad, Región", "Presencial"]
const BASE = 'https://www.laborum.cl';

// El listado trae ~20 por página y pagina con `?page=2`.
const MAX_PAGINAS = 4;

function slug(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function leerPagina(page: Page, query: string, pagina: number): Promise<OfertaCruda[]> {
  const url = `${BASE}/empleos-busqueda-${slug(query)}.html` + (pagina > 1 ? `?page=${pagina}` : '');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('a[href^="/empleos/"]', { timeout: 12000 }).catch(() => {});
  // El listado se pinta con JS: le damos un respiro.
  await page.waitForTimeout(2500);

  return page.$$eval('a[href^="/empleos/"]', (anclas, base) => {
    const vistos = new Set<string>();
    const ofertas: any[] = [];

    for (const a of anclas) {
      const href = a.getAttribute('href') || '';
      // Solo enlaces de oferta real: terminan en -<id>.html
      if (!/-\d{6,}\.html$/.test(href) || vistos.has(href)) continue;
      vistos.add(href);

      // Subimos hasta el contenedor de la tarjeta (el que ya tiene varias líneas).
      let cont: HTMLElement | null = a as HTMLElement;
      for (let i = 0; i < 5 && cont; i++) {
        if ((cont.innerText || '').split('\n').filter(Boolean).length >= 3) break;
        cont = cont.parentElement;
      }

      const lineas = (cont?.innerText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        // fuera: la fecha ("Actualizado hace 5 días"), la nota de la empresa ("4.0")
        // y los badges sueltos ("Nuevo", "Destacado", "Postulación rápida"), que si
        // no se colaban como título.
        .filter(
          (t) =>
            !/^(actualizado|publicado)\s+hace/i.test(t) &&
            !/^\d[.,]\d$/.test(t) &&
            !/^(nuevo|nueva|destacad[oa]|urgente|postulaci[oó]n r[aá]pida)$/i.test(t)
        );

      if (lineas.length === 0) continue;

      const modalidad = lineas.find((t) => /^(remoto|h[ií]brido|presencial)$/i.test(t)) || '';
      // La ubicación es corta y nombra una región/comuna. Pedimos poco largo para
      // que no se cuele la descripción (que también trae comas).
      const ubicacion =
        lineas.find((t) => t !== modalidad && t.length < 60 && /regi[oó]n|metropolitana/i.test(t)) || 'Chile';
      const restantes = lineas.filter((t) => t !== modalidad && t !== ubicacion);
      const titulo = restantes[0] || '';
      const empresa = restantes[1] && restantes[1].length < 70 ? restantes[1] : 'Empresa no informada';
      // Algunas tarjetas destacadas traen la descripción completa: la línea más larga.
      const descripcion = restantes.slice(1).sort((x, y) => y.length - x.length)[0] || titulo;

      ofertas.push({
        fuente: 'laborum',
        titulo,
        empresa,
        ubicacion,
        remoto: /remoto|h[ií]brido/i.test(`${modalidad} ${titulo}`),
        url: base + href,
        salario: '',
        descripcion: descripcion.slice(0, 3000),
        tags: [],
      });
    }
    return ofertas;
  }, BASE);
}

export async function scrapeLaborum(busquedas: string[]): Promise<OfertaCruda[]> {
  const porUrl = new Map<string, OfertaCruda>();
  try {
    // Un solo navegador para todas las búsquedas y páginas.
    await conNavegador(async (page) => {
      for (const q of busquedas) {
        for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
          try {
            const ofertas = await leerPagina(page, q, pagina);
            if (ofertas.length === 0) break; // no hay más páginas
            let nuevas = 0;
            for (const o of ofertas) {
              if (!o.url || !o.titulo) continue;
              if (!porUrl.has(o.url)) nuevas++;
              porUrl.set(o.url, o);
            }
            if (nuevas === 0) break; // ya estamos dando vueltas
          } catch (e: any) {
            console.warn(`   ⚠ Laborum falló con "${q}" (pág ${pagina}): ${e.message}`);
            break;
          }
        }
      }
    });
  } catch (e: any) {
    console.warn(`   ⚠ Laborum no pudo abrir el navegador: ${e.message}`);
  }
  return [...porUrl.values()];
}
