import { OfertaCruda } from '../tipos';
import { conNavegador } from './navegador';

// ChileTrabajos. Sin API pública; leemos el HTML del buscador.
// Best-effort: si cambian los selectores, devuelve [] y avisa.
const BASE = 'https://www.chiletrabajos.cl';

async function buscarQuery(query: string): Promise<OfertaCruda[]> {
  const url = `${BASE}/trabajos?q=${encodeURIComponent(query)}`;
  return conNavegador(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page
      .waitForSelector('.job-item, article, .aviso, .listado-avisos li', { timeout: 12000 })
      .catch(() => {});

    return page.$$eval(
      '.job-item, article, .aviso, .listado-avisos li',
      (nodos, base) => {
        return nodos
          .map((n) => {
            const a = n.querySelector('a[href]') as HTMLAnchorElement | null;
            const titulo =
              n.querySelector('h2, h3, .titulo, .job-title')?.textContent?.trim() ??
              a?.textContent?.trim() ??
              '';
            const empresa = n.querySelector('.empresa, .company, .job-company')?.textContent?.trim() ?? '';
            const ubic = n.querySelector('.ubicacion, .location, .ciudad')?.textContent?.trim() ?? '';
            const desc = n.querySelector('p, .descripcion, .job-desc')?.textContent?.trim() ?? '';
            const href = a?.getAttribute('href') ?? '';
            return {
              fuente: 'chiletrabajos',
              titulo,
              empresa: empresa || 'Empresa no informada',
              ubicacion: ubic || 'Chile',
              remoto: /remoto|teletrabajo|home ?office/i.test(`${ubic} ${desc} ${titulo}`),
              url: href.startsWith('http') ? href : base + href,
              salario: '',
              descripcion: desc,
              tags: [],
            };
          })
          .filter((o) => o.titulo && o.url);
      },
      BASE
    );
  });
}

export async function scrapeChileTrabajos(busquedas: string[]): Promise<OfertaCruda[]> {
  const porUrl = new Map<string, OfertaCruda>();
  for (const q of busquedas) {
    try {
      const ofertas = await buscarQuery(q);
      for (const o of ofertas) porUrl.set(o.url, o);
    } catch (e: any) {
      console.warn(`   ⚠ ChileTrabajos falló con "${q}": ${e.message}`);
    }
  }
  return [...porUrl.values()];
}
