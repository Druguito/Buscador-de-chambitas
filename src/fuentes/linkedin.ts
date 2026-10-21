import { OfertaCruda } from '../tipos';

// LinkedIn no da API abierta, pero su endpoint "jobs-guest" devuelve HTML sin login.
// Ojo: LinkedIn limita las peticiones (puede dar 429). Por eso viene apagado por
// defecto en profile.yaml. Si empieza a fallar, déjalo en false.
const BASE = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

// Decodifica las entidades HTML más comunes (&amp; → &, etc.) que LinkedIn deja
// en los títulos.
function decodificar(texto: string): string {
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extraer(html: string, regex: RegExp): string {
  const m = html.match(regex);
  return m ? decodificar(m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()) : '';
}

// Cuántas páginas pedir por búsqueda (LinkedIn devuelve ~25 por página).
// 4 páginas ≈ 100 ofertas por término. Súbelo si quieres más (mayor riesgo de 429).
const MAX_PAGINAS = 4;
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Marca especial: LinkedIn nos frenó (429). Sirve para cortar la paginación.
class Error429 extends Error {}

// Pide UNA página (start = 0, 25, 50...) y devuelve sus ofertas.
async function buscarPagina(query: string, ubicacion: string, start: number): Promise<OfertaCruda[]> {
  const url = `${BASE}?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(ubicacion)}&start=${start}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html',
    },
  });
  if (res.status === 429) throw new Error429('429');
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

// Recorre varias páginas de una búsqueda hasta que se acaben o LinkedIn nos frene.
// Devuelve lo que alcanzó a juntar + si nos frenaron (para no seguir insistiendo).
async function buscarQuery(
  query: string,
  ubicacion: string
): Promise<{ ofertas: OfertaCruda[]; frenado: boolean }> {
  const ofertas: OfertaCruda[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    try {
      const lote = await buscarPagina(query, ubicacion, pagina * 25);
      if (lote.length === 0) break; // no hay más resultados
      ofertas.push(...lote);
      await pausa(1200); // respirar entre páginas para no gatillar el 429
    } catch (e: any) {
      if (e instanceof Error429) return { ofertas, frenado: true };
      console.warn(`   ⚠ LinkedIn falló con "${query}" (pág ${pagina + 1}): ${e.message}`);
      break;
    }
  }
  return { ofertas, frenado: false };
}

export async function scrapeLinkedIn(busquedas: string[], ubicacion = 'Chile'): Promise<OfertaCruda[]> {
  const porUrl = new Map<string, OfertaCruda>();
  for (const q of busquedas) {
    const { ofertas, frenado } = await buscarQuery(q, ubicacion);
    for (const o of ofertas) porUrl.set(o.url, o);
    if (frenado) {
      // Guardamos lo que alcanzamos y dejamos de insistir para no empeorar el bloqueo.
      console.warn('   ⚠ LinkedIn nos frenó (429). Uso lo que traje y sigo con las otras fuentes.');
      break;
    }
    await pausa(1500); // pausa entre búsquedas
  }
  return [...porUrl.values()];
}
