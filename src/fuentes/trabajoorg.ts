import { OfertaCruda } from '../tipos';
import { conNavegador } from './navegador';

// Trabajo.org (cl.trabajo.org) — agregador con MUCHAS ofertas de todo Chile
// (es una de las fuentes que Google muestra en su widget de empleos).
// OJO: navegar directo a la URL de resultados lo bloquea (anti-bot: exige venir
// del formulario). Por eso hacemos la búsqueda llenando el buscador y enviándolo.
// Card: <li class="job-item" data-url="..."> con h3 (título) y spans (ubicación,
// empresa, tipo de jornada).
const BASE = 'https://cl.trabajo.org';

export async function scrapeTrabajoOrg(busquedas: string[]): Promise<OfertaCruda[]> {
  const porUrl = new Map<string, OfertaCruda>();
  try {
    await conNavegador(async (page) => {
      for (const q of busquedas) {
        try {
          await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.fill('input[name="sKeyword"]', q);
          await page.keyboard.press('Enter');
          await page.waitForSelector('.job-item', { timeout: 12000 }).catch(() => {});

          const ofertas = await page.$$eval('.job-item', (nodos) => {
            const badge = /^(premium|nuevo|nueva|destacada|destacado)$/i;
            const jornada = /jornada|tiempo completo|media jornada|parcial|part.?time|por hora|turno/i;
            return nodos
              .map((n) => {
                const el = n as HTMLElement;
                const url = el.getAttribute('data-url') || '';
                let titulo = (el.querySelector('h3, h2')?.textContent || '').replace(/\s+/g, ' ').trim();
                titulo = titulo.replace(/\s*(Premium|Nuevo|Nueva|Destacada|Destacado)\s*$/i, '').trim();
                if (!titulo) titulo = (el.getAttribute('title') || '').split(/ en /)[0].trim();
                const spans = Array.from(el.querySelectorAll('span'))
                  .map((s) => (s.textContent || '').replace(/\s+/g, ' ').trim())
                  .filter(Boolean);
                const ubic = spans.find((t) => /,\s*(chile|.*regi[oó]n)/i.test(t)) || 'Chile';
                const empresa =
                  spans.find((t) => !badge.test(t) && t !== ubic && !jornada.test(t) && t.length < 60) ||
                  'Empresa no informada';
                return {
                  fuente: 'trabajoorg',
                  titulo,
                  empresa,
                  ubicacion: ubic,
                  remoto: /remoto|teletrabajo|home ?office|h[ií]brido/i.test(`${ubic} ${titulo}`),
                  url,
                  salario: '',
                  descripcion: titulo,
                  tags: [],
                };
              })
              .filter((o) => o.titulo && o.url);
          });
          for (const o of ofertas) porUrl.set(o.url, o);
        } catch (e: any) {
          console.warn(`   ⚠ Trabajo.org falló con "${q}": ${e.message}`);
        }
      }
    });
  } catch (e: any) {
    console.warn(`   ⚠ Trabajo.org no pudo abrir el navegador: ${e.message}`);
  }
  return [...porUrl.values()];
}
