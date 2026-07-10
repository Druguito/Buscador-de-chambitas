import { OfertaCruda } from '../tipos';

// LinkedIn no da API abierta, pero su endpoint "jobs-guest" devuelve HTML sin login.
// Ojo: LinkedIn limita las peticiones (puede dar 429). Por eso viene apagado por
// defecto en profile.yaml. Si empieza a fallar, déjalo en false.
const BASE = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

function extraer(html: string, regex: RegExp): string {
  const m = html.match(regex);
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
}

async function buscarQuery(query: string, ubicacion: string): Promise<OfertaCruda[]> {
  const url = `${BASE}?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(ubicacion)}&start=0`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`LinkedIn HTTP ${res.status}`);
  const html = await res.text();

  // Cada oferta viene en un <li>...</li>
  const tarjetas = html.split(/<li>/).slice(1);
  const ofertas: OfertaCruda[] = [];
  for (const t of tarjetas) {
    const link = extraer(t, /href="([^"]*\/jobs\/view\/[^"?]+)/);
    const titulo = extraer(t, /base-search-card__title">([^]*?)<\/h3>/);
    const empresa = extraer(t, /base-search-card__subtitle">([^]*?)<\/h4>/);
    const ubic = extraer(t, /job-search-card__location">([^]*?)<\/span>/);
    if (!link || !titulo) continue;
    ofertas.push({
      fuente: 'linkedin',
      titulo,
      empresa: empresa || 'Empresa no informada',
      ubicacion: ubic || ubicacion,
      remoto: /remote|remoto|híbrido|hibrido/i.test(`${ubic} ${titulo}`),
      url: link.split('?')[0],
      salario: '',
      descripcion: titulo,
      tags: [],
    });
  }
  return ofertas;
}

export async function scrapeLinkedIn(busquedas: string[], ubicacion = 'Chile'): Promise<OfertaCruda[]> {
  const porUrl = new Map<string, OfertaCruda>();
  for (const q of busquedas) {
    try {
      const ofertas = await buscarQuery(q, ubicacion);
      for (const o of ofertas) porUrl.set(o.url, o);
      // Pequeña pausa para no gatillar el límite de LinkedIn.
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e: any) {
      console.warn(`   ⚠ LinkedIn falló con "${q}": ${e.message}`);
    }
  }
  return [...porUrl.values()];
}
