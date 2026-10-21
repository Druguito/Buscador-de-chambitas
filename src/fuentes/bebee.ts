import { OfertaCruda } from '../tipos';
import { conNavegador } from './navegador';
import { Page } from 'playwright';

// beBee Chile (bebee.com/cl/jobs) — AGREGADOR: junta avisos de varios portales
// (se ven links tipo "...-laborum--ss-cl-..."), así que se solapa con otras fuentes.
// El dedupe por título+empresa de store.ts se encarga de no repetir.
// Lo bueno: es de las pocas fuentes con navegador que entrega DESCRIPCIÓN larga en
// el listado (~300 chars), así que sus ofertas matchean muchas más skills que las
// de Computrabajo (118) o LinkedIn (43).
//
// Cada tarjeta viene como líneas de texto, PERO el formato varía:
//   con ciudad:  ["Título", "Santiago", "Empresa", "Descripción...", "Hoy"]
//   sin ciudad:  ["Título", "Empresa", "Descripción...", "Hoy"]
// Por eso hay que detectar si la 2ª línea es un lugar o ya es la empresa; si no,
// se guardaba la empresa como ubicación.
// Los links de oferta real llevan el marcador `--ss-cl-`.
const BASE = 'https://bebee.com';

// ~20 ofertas por página; pagina con `&page=2` (ojo: `&p=2` NO sirve, repite la 1).
const MAX_PAGINAS = 4;

async function leerPagina(page: Page, query: string, pagina: number): Promise<OfertaCruda[]> {
  const url = `${BASE}/cl/jobs?q=${encodeURIComponent(query)}` + (pagina > 1 ? `&page=${pagina}` : '');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('a[href*="--ss-cl-"]', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2000);

  return page.$$eval('a[href*="--ss-cl-"]', (anclas, base) => {
    const vistos = new Set<string>();
    const ofertas: any[] = [];

    // ¿La línea parece una ubicación chilena y no el nombre de una empresa?
    const esLugar = (t: string) =>
      !!t &&
      t.length < 45 &&
      /santiago|providencia|condes|vitacura|huechuraba|[nñ]u[nñ]oa|maip[uú]|puente alto|valpara|vi[nñ]a|quilpu|concepci|talcahuano|hualp|coronel|chill[aá]n|antofagasta|calama|iquique|arica|copiap|la serena|coquimbo|rancagua|talca|curic|temuco|valdivia|osorno|puerto montt|punta arenas|chile|regi[oó]n|remoto/i.test(
        t
      );

    for (const a of anclas) {
      const href = (a.getAttribute('href') || '').split('?')[0];
      if (!href || vistos.has(href)) continue;
      vistos.add(href);

      // Subimos hasta el contenedor con los datos de la tarjeta.
      let cont: HTMLElement | null = a as HTMLElement;
      for (let i = 0; i < 5 && cont; i++) {
        if ((cont.innerText || '').split('\n').filter(Boolean).length >= 3) break;
        cont = cont.parentElement;
      }

      const lineas = (cont?.innerText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        // fuera la jornada y la fecha, que van al final y no aportan
        .filter(
          (t) =>
            !/^(hoy|ayer|hace\s|publicad)/i.test(t) &&
            !/^(tiempo (parcial|completo)|jornada|full.?time|part.?time)$/i.test(t)
        );

      if (lineas.length < 2) continue;

      const titulo = lineas[0];
      const l1 = lineas[1] || '';
      const l2 = lineas[2] || '';
      let ubicacion = 'Chile';
      let empresa = 'Empresa no informada';
      if (esLugar(l1)) {
        ubicacion = l1;
        if (l2 && l2.length < 60) empresa = l2;
      } else if (l1 && l1.length < 60) {
        // tarjeta sin ciudad: la 2ª línea ya es la empresa
        empresa = l1;
        if (esLugar(l2)) ubicacion = l2;
      }
      // La descripción es la línea más larga (beBee la trae completa).
      const descripcion = lineas.slice(1).sort((x, y) => y.length - x.length)[0] || titulo;

      ofertas.push({
        fuente: 'bebee',
        titulo,
        empresa,
        ubicacion,
        remoto: /remoto|teletrabajo|home ?office|h[ií]brid/i.test(`${titulo} ${ubicacion} ${descripcion}`),
        url: base + href,
        salario: '',
        descripcion: descripcion.slice(0, 4000),
        tags: [],
      });
    }
    return ofertas;
  }, BASE);
}

export async function scrapeBeBee(busquedas: string[]): Promise<OfertaCruda[]> {
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
            console.warn(`   ⚠ beBee falló con "${q}" (pág ${pagina}): ${e.message}`);
            break;
          }
        }
      }
    });
  } catch (e: any) {
    console.warn(`   ⚠ beBee no pudo abrir el navegador: ${e.message}`);
  }
  return [...porUrl.values()];
}
