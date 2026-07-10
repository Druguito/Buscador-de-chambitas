import { OfertaCruda } from '../tipos';
import { conNavegador } from './navegador';

// Computrabajo Chile. No tiene API pública, así que leemos el HTML del listado.
// Los selectores pueden cambiar; si el sitio los cambia, esto devuelve [] y avisa.
const BASE = 'https://cl.computrabajo.com';

function slug(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, '-');
}

async function buscarQuery(query: string): Promise<OfertaCruda[]> {
  const url = `${BASE}/trabajo-de-${encodeURIComponent(slug(query))}`;
  return conNavegador(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Cada oferta es un artículo con clase que empieza con "box_offer".
    await page.waitForSelector('article.box_offer', { timeout: 12000 }).catch(() => {});

    return page.$$eval('article.box_offer', (nodos, base) => {
      return nodos.map((n) => {
        const a = n.querySelector('h2 a, a.js-o-link') as HTMLAnchorElement | null;
        const empresa = n.querySelector('p.dIB, a.dIB, .fc_base')?.textContent?.trim() ?? '';
        const ubic = n.querySelector('p.fs16, .fc_aux')?.textContent?.trim() ?? '';
        const desc = n.querySelector('div.fc_aux, p')?.textContent?.trim() ?? '';
        const href = a?.getAttribute('href') ?? '';
        return {
          fuente: 'computrabajo',
          titulo: a?.textContent?.trim() ?? '',
          empresa: empresa || 'Empresa no informada',
          ubicacion: ubic || 'Chile',
          remoto: /remoto|teletrabajo|home ?office/i.test(`${ubic} ${desc}`),
          url: href.startsWith('http') ? href : base + href,
          salario: '',
          descripcion: desc,
          tags: [],
        };
      });
    }, BASE);
  });
}

export async function scrapeComputrabajo(busquedas: string[]): Promise<OfertaCruda[]> {
  const porUrl = new Map<string, OfertaCruda>();
  for (const q of busquedas) {
    try {
      const ofertas = await buscarQuery(q);
      for (const o of ofertas) if (o.url && o.titulo) porUrl.set(o.url, o);
    } catch (e: any) {
      console.warn(`   ⚠ Computrabajo falló con "${q}": ${e.message}`);
    }
  }
  return [...porUrl.values()];
}
