import { OfertaCruda } from '../tipos';
import { conNavegador } from './navegador';

// Trabajando.com Chile. No tiene API pública y las ofertas se renderizan con
// JavaScript (el sitio es Nuxt), así que hay que leer el DOM ya renderizado con
// navegador. Los selectores pueden cambiar; si el sitio los cambia, esto
// devuelve [] y avisa, sin romper el resto de la búsqueda.
const BASE = 'https://www.trabajando.cl';

function slug(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, '-');
}

async function buscarQuery(query: string): Promise<OfertaCruda[]> {
  const url = `${BASE}/trabajo-empleo/${encodeURIComponent(slug(query))}`;
  return conNavegador(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Cada oferta es un div.result-box-container (se renderiza vía JS).
    await page.waitForSelector('.result-box-container', { timeout: 15000 }).catch(() => {});

    return page.$$eval('.result-box-container', (nodos, base) => {
      return nodos.map((n) => {
        const a = n.querySelector('h2 a') as HTMLAnchorElement | null;
        const empresa = n.querySelector('.type')?.textContent?.trim() ?? '';
        const ubic = n.querySelector('.location')?.textContent?.trim() ?? '';
        const desc = n.querySelector('.description')?.textContent?.trim() ?? '';
        const href = a?.getAttribute('href') ?? '';
        const titulo = a?.textContent?.trim() ?? '';
        return {
          fuente: 'trabajando',
          titulo,
          empresa: empresa || 'Empresa no informada',
          ubicacion: ubic || 'Chile',
          // Trabajando suele poner la modalidad en el título (ej "Híbrido (4x1)").
          remoto: /remoto|teletrabajo|home ?office|h[ií]brido/i.test(`${titulo} ${ubic} ${desc}`),
          url: href.startsWith('http') ? href : base + href,
          salario: '',
          descripcion: desc,
          tags: [],
        };
      });
    }, BASE);
  });
}

export async function scrapeTrabajando(busquedas: string[]): Promise<OfertaCruda[]> {
  const porUrl = new Map<string, OfertaCruda>();
  for (const q of busquedas) {
    try {
      const ofertas = await buscarQuery(q);
      for (const o of ofertas) if (o.url && o.titulo) porUrl.set(o.url, o);
    } catch (e: any) {
      console.warn(`   ⚠ Trabajando falló con "${q}": ${e.message}`);
    }
  }
  return [...porUrl.values()];
}
