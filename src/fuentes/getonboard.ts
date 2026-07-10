import { OfertaCruda } from '../tipos';

// GetOnBoard tiene API pública JSON gratis. Nada de login ni navegador.
// Docs: https://www.getonbrd.com/api
const BASE = 'https://www.getonbrd.com/api/v0';

function limpiarHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function textoDesde(valor: any): string {
  // Varios campos vienen como { data: "..." } o como string directo.
  if (!valor) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'object' && 'data' in valor) return String(valor.data ?? '');
  return String(valor);
}

async function buscarQuery(query: string, porPagina = 50): Promise<OfertaCruda[]> {
  const url = `${BASE}/search/jobs?query=${encodeURIComponent(query)}&per_page=${porPagina}&expand=["company"]`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GetOnBoard HTTP ${res.status}`);

  const json: any = await res.json();
  const items: any[] = json?.data ?? [];

  return items.map((it): OfertaCruda => {
    const a = it.attributes ?? {};
    const empresa = textoDesde(a.company?.data?.name ?? a.company?.name ?? a.company);
    const ciudades = textoDesde(a.location_cities);
    const remoto = a.remote === true || textoDesde(a.remote_modality).toLowerCase().includes('remote');

    let salario = '';
    if (a.min_salary || a.max_salary) {
      salario = `USD ${a.min_salary ?? '?'} - ${a.max_salary ?? '?'}`;
    }

    return {
      fuente: 'getonboard',
      titulo: textoDesde(a.title),
      empresa: empresa || 'Empresa no informada',
      ubicacion: [ciudades, remoto ? 'Remoto' : ''].filter(Boolean).join(' · ') || (remoto ? 'Remoto' : 'Chile'),
      remoto,
      url: it.links?.public_url ?? `https://www.getonbrd.com/jobs/${it.id}`,
      salario,
      descripcion: limpiarHtml(
        [textoDesde(a.description), textoDesde(a.functions), textoDesde(a.desirable)].join(' ')
      ).slice(0, 4000),
      tags: Array.isArray(a.tags) ? a.tags.map((t: any) => textoDesde(t)) : [],
    };
  });
}

export async function scrapeGetOnBoard(busquedas: string[]): Promise<OfertaCruda[]> {
  const porUrl = new Map<string, OfertaCruda>();
  for (const q of busquedas) {
    try {
      const ofertas = await buscarQuery(q);
      for (const o of ofertas) if (o.url) porUrl.set(o.url, o);
    } catch (e: any) {
      console.warn(`   ⚠ GetOnBoard falló con "${q}": ${e.message}`);
    }
  }
  return [...porUrl.values()];
}
