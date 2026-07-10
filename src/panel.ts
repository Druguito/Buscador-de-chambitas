import http from 'http';
import { spawn } from 'child_process';
import { cargar, cambiarEstado } from './store';
import { Estado } from './tipos';
import { paginaHtml } from './html';

const PUERTO = 4321;

function abrirNavegador(url: string) {
  // En Windows: cmd /c start. En Mac: open. En Linux: xdg-open.
  const plat = process.platform;
  if (plat === 'win32') spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' });
  else if (plat === 'darwin') spawn('open', [url], { detached: true, stdio: 'ignore' });
  else spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
}

function enviarJson(res: http.ServerResponse, data: unknown, codigo = 200) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PUERTO}`);

  // Página principal
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(paginaHtml());
    return;
  }

  // Lista de ofertas en JSON
  if (req.method === 'GET' && url.pathname === '/api/ofertas') {
    const ofertas = cargar().sort((a, b) => b.puntaje - a.puntaje);
    enviarJson(res, ofertas);
    return;
  }

  // Cambiar estado de una oferta (postular / guardar / descartar / volver a nueva)
  if (req.method === 'POST' && url.pathname === '/api/accion') {
    let cuerpo = '';
    req.on('data', (c) => (cuerpo += c));
    req.on('end', () => {
      try {
        const { id, estado } = JSON.parse(cuerpo) as { id: string; estado: Estado };
        const ok = cambiarEstado(id, estado);
        enviarJson(res, { ok }, ok ? 200 : 404);
      } catch {
        enviarJson(res, { ok: false, error: 'JSON inválido' }, 400);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('No encontrado');
});

servidor.listen(PUERTO, () => {
  const url = `http://localhost:${PUERTO}`;
  const total = cargar().length;
  console.log(`\n🖥️  Panel abierto en ${url}`);
  console.log(`   ${total} ofertas en tu lista.`);
  console.log(`   (Deja esta ventana abierta mientras usas el panel. Ctrl+C para cerrar.)\n`);
  abrirNavegador(url);
});
