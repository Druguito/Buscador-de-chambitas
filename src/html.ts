// Genera el HTML del panel. Todo va inline (CSS + JS) para no depender de nada.
export function paginaHtml(): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mis chambas</title>
<style>
  :root { --bg:#0f1115; --card:#1a1e26; --card2:#20252f; --txt:#e6e9ef; --muted:#8b93a3;
          --acc:#4f8cff; --ok:#2ecc71; --warn:#f0a020; --bad:#e05a5a; --line:#2a2f3a; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--txt); }
  header { padding:20px 24px; border-bottom:1px solid var(--line); position:sticky; top:0;
           background:var(--bg); z-index:5; }
  h1 { margin:0 0 4px; font-size:20px; }
  .sub { color:var(--muted); font-size:13px; }
  .tabs { display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
  .tab { padding:7px 14px; border-radius:20px; background:var(--card); color:var(--muted);
         cursor:pointer; font-size:13px; border:1px solid var(--line); user-select:none; }
  .tab.activo { background:var(--acc); color:#fff; border-color:var(--acc); }
  .tab .n { opacity:.8; }
  main { padding:20px 24px; max-width:960px; margin:0 auto; display:grid; gap:12px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px 18px; }
  .card .top { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
  .titulo { font-size:16px; font-weight:600; margin:0; }
  .empresa { color:var(--muted); font-size:13px; margin:3px 0 0; }
  .meta { display:flex; gap:8px; flex-wrap:wrap; margin:10px 0; }
  .chip { font-size:11px; padding:3px 9px; border-radius:12px; background:var(--card2); color:var(--muted); }
  .chip.skill { background:rgba(79,140,255,.15); color:#9cc0ff; }
  .chip.remoto { background:rgba(46,204,113,.15); color:#7fe0a5; }
  .chip.fuente { background:rgba(240,160,32,.13); color:#f0c078; text-transform:capitalize; }
  .score { font-size:22px; font-weight:700; color:var(--acc); white-space:nowrap; }
  .score small { font-size:11px; color:var(--muted); font-weight:400; display:block; text-align:right; }
  .desc { color:var(--muted); font-size:13px; line-height:1.5; max-height:60px; overflow:hidden; }
  .acciones { display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
  button { border:none; border-radius:8px; padding:8px 14px; font-size:13px; cursor:pointer; font-weight:600; }
  .b-post { background:var(--ok); color:#06210f; }
  .b-guard { background:var(--card2); color:var(--txt); border:1px solid var(--line); }
  .b-desc { background:transparent; color:var(--bad); border:1px solid var(--bad); }
  .b-volver { background:transparent; color:var(--muted); border:1px solid var(--line); }
  a.link { color:var(--acc); text-decoration:none; font-size:13px; }
  .vacio { text-align:center; color:var(--muted); padding:60px 20px; }
  .estado-tag { font-size:11px; padding:3px 9px; border-radius:12px; font-weight:600; }
  .e-postulada { background:rgba(46,204,113,.2); color:#7fe0a5; }
  .e-descartada { background:rgba(224,90,90,.18); color:#f0a0a0; }
  .e-guardada { background:rgba(240,160,32,.18); color:#f0c078; }
</style>
</head>
<body>
<header>
  <h1>💼 Mis chambas</h1>
  <div class="sub">Ofertas encontradas para ti · marca las que postules o descarta las que no.</div>
  <div class="tabs" id="tabs"></div>
</header>
<main id="lista"></main>

<script>
const ESTADOS = [
  { k:'nueva',      etiqueta:'✨ Nuevas' },
  { k:'guardada',   etiqueta:'⭐ Guardadas' },
  { k:'postulada',  etiqueta:'✅ Postuladas' },
  { k:'descartada', etiqueta:'🗑️ Descartadas' },
];
let todas = [];
let filtro = 'nueva';

async function cargar() {
  const r = await fetch('/api/ofertas');
  todas = await r.json();
  render();
}

async function accion(id, estado) {
  await fetch('/api/accion', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id, estado })
  });
  const o = todas.find(x => x.id === id);
  if (o) o.estado = estado;
  render();
}

function esc(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function tarjeta(o) {
  const skills = (o.coincidencias||[]).map(s => '<span class="chip skill">'+esc(s)+'</span>').join('');
  const remoto = o.remoto ? '<span class="chip remoto">Remoto</span>' : '';
  const salario = o.salario ? '<span class="chip">'+esc(o.salario)+'</span>' : '';
  let acciones = '';
  if (o.estado === 'nueva' || o.estado === 'guardada') {
    acciones =
      '<button class="b-post" onclick="postular(\\''+o.id+'\\',\\''+esc(o.url)+'\\')">Postular ↗</button>' +
      (o.estado==='nueva' ? '<button class="b-guard" onclick="accion(\\''+o.id+'\\',\\'guardada\\')">⭐ Guardar</button>' : '') +
      '<button class="b-desc" onclick="accion(\\''+o.id+'\\',\\'descartada\\')">Descartar</button>';
  } else {
    acciones = '<button class="b-volver" onclick="accion(\\''+o.id+'\\',\\'nueva\\')">↩ Volver a nuevas</button>' +
      '<a class="link" href="'+esc(o.url)+'" target="_blank" style="align-self:center">ver oferta ↗</a>';
  }
  return '<div class="card">' +
    '<div class="top"><div>' +
      '<p class="titulo">'+esc(o.titulo)+'</p>' +
      '<p class="empresa">'+esc(o.empresa)+' · '+esc(o.ubicacion)+'</p>' +
    '</div><div class="score">'+o.puntaje+'<small>puntaje</small></div></div>' +
    '<div class="meta"><span class="chip fuente">'+esc(o.fuente)+'</span>'+remoto+salario+skills+'</div>' +
    '<div class="desc">'+esc((o.descripcion||'').slice(0,320))+'</div>' +
    '<div class="acciones">'+acciones+'</div>' +
  '</div>';
}

function postular(id, url) {
  window.open(url, '_blank');
  accion(id, 'postulada');
}

function render() {
  // pestañas con conteo
  document.getElementById('tabs').innerHTML = ESTADOS.map(e => {
    const n = todas.filter(o => o.estado === e.k).length;
    return '<div class="tab '+(filtro===e.k?'activo':'')+'" onclick="setFiltro(\\''+e.k+'\\')">'+
      e.etiqueta+' <span class="n">'+n+'</span></div>';
  }).join('');

  const items = todas.filter(o => o.estado === filtro);
  const lista = document.getElementById('lista');
  if (!items.length) {
    lista.innerHTML = '<div class="vacio">No hay ofertas aquí.<br>' +
      (filtro==='nueva' ? 'Corre <b>npm run buscar</b> en la terminal para traer nuevas.' : '') + '</div>';
    return;
  }
  lista.innerHTML = items.map(tarjeta).join('');
}

function setFiltro(k){ filtro = k; render(); }
cargar();
</script>
</body>
</html>`;
}
