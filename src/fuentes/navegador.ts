import { chromium, Browser, Page } from 'playwright';

// Usamos el navegador que YA tengas instalado en Windows (Edge o Chrome),
// así no hay que descargar el Chromium propio de Playwright.
// Orden de intento: Edge → Chrome → Chromium propio (si existiera).
const CANALES: (string | undefined)[] = ['msedge', 'chrome', undefined];

async function abrirBrowser(headless: boolean): Promise<Browser> {
  let ultimoError: unknown;
  for (const channel of CANALES) {
    try {
      return await chromium.launch({ headless, channel });
    } catch (e) {
      ultimoError = e;
    }
  }
  throw new Error(
    'No pude abrir Edge, Chrome ni Chromium. Instala Edge/Chrome, o corre ' +
      '"npx playwright install chromium". Detalle: ' +
      (ultimoError instanceof Error ? ultimoError.message : String(ultimoError))
  );
}

// Ayudante para abrir un navegador real (necesario para sitios que no tienen API).
export async function conNavegador<T>(
  fn: (pagina: Page) => Promise<T>,
  opciones: { headless?: boolean } = {}
): Promise<T> {
  const browser = await abrirBrowser(opciones.headless ?? true);
  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      locale: 'es-CL',
    });
    const page = await context.newPage();
    return await fn(page);
  } finally {
    await browser.close();
  }
}
