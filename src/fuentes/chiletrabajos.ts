import { OfertaCruda } from '../tipos';
import { conNavegador } from './navegador';

// ChileTrabajos. Sin API pública; leemos el HTML del buscador.
// Best-effort: si cambian los selectores, devuelve [] y avisa.
const BASE = 'https://www.chiletrabajos.cl';

async function buscarQuery(query: string): Promise<OfertaCruda[]> {
  // OJO: la ruta vieja `/trabajos?q=` ahora redirige a /404. La búsqueda real
  // vive en `/empleos?q=`. Aun así, el buscador de ChileTrabajos es impreciso
  // (a veces ignora la palabra y trae rubros random); el filtro de skills limpia
  // ese ruido después.
  const url = `${BASE}/empleos?q=${encodeURIComponent(query)}`;
  return conNavegador(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.job-item', { timeout: 12000 }).catch(() => {});

    return page.$$eval('.job-item', (nodos, base) => {
      return nodos
        .map((n) => {
          // Título y link: <h2 class="title"><a href="...">TÍTULO</a></h2>
          const a = (n.querySelector('h2.title a, h2 a, a[href]') as HTMLAnchorElement | null);
          const titulo = a?.textContent?.trim() ?? '';
          // Empresa + ciudad: <h3 class="meta">Empresa, <a>Ciudad</a></h3>
          const meta = n.querySelector('h3.meta, .meta');
          const ciudad = meta?.querySelector('a')?.textContent?.trim() ?? '';
          let empresa = (meta?.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (ciudad) empresa = empresa.replace(ciudad, '');
          empresa = empresa.replace(/[,\s]+$/, '').trim();
          const desc = n.querySelector('.description, .descripcion, p')?.textContent?.trim() ?? '';
          const href = a?.getAttribute('href') ?? '';
          return {
            fuente: 'chiletrabajos',
            titulo,
            empresa: empresa || 'Empresa no informada',
            ubicacion: ciudad || 'Chile',
            remoto: /remoto|teletrabajo|home ?office/i.test(`${ciudad} ${desc} ${titulo}`),
            url: href.startsWith('http') ? href : base + href,
            salario: '',
            descripcion: desc,
            tags: [],
          };
        })
        .filter((o) => o.titulo && o.url);
    }, BASE);
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
