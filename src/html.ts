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
  .buscador { margin-top:12px; display:flex; align-items:center; gap:8px; }
  .buscador input { flex:1; max-width:420px; padding:9px 14px; border-radius:10px;
         background:var(--card); border:1px solid var(--line); color:var(--txt); font-size:14px; }
  .buscador input::placeholder { color:var(--muted); }
  .buscador .cont { color:var(--muted); font-size:12px; }
  .sel-orden { padding:8px 10px; border-radius:8px; background:var(--card); color:var(--txt);
         border:1px solid var(--line); font-size:13px; cursor:pointer; }
  .btn-excel { margin-left:auto; padding:8px 14px; border-radius:8px; background:rgba(46,204,113,.15);
         color:#7fe0a5; border:1px solid rgba(46,204,113,.4); font-size:13px; font-weight:600;
         text-decoration:none; white-space:nowrap; }
  .btn-excel:hover { background:rgba(46,204,113,.25); }
  .fecha { color:var(--muted); font-size:11px; white-space:nowrap; }
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
  .acciones { display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; align-items:center; }
  .pregunta { font-size:13px; font-weight:600; color:var(--warn); margin-right:2px; }
  .link-google { align-self:center; margin-left:auto; font-size:12px; color:var(--muted);
         text-decoration:none; border:1px solid var(--line); padding:6px 10px; border-radius:8px; }
  .link-google:hover { color:var(--txt); border-color:var(--acc); }
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
  <div class="buscador">
    <input id="buscador" type="search" placeholder="🔍 Buscar por título, empresa, skill..."
           oninput="setBuscar(this.value)" autocomplete="off">
    <span class="cont" id="contador"></span>
    <select id="orden" class="sel-orden" onchange="setOrden(this.value)" title="Ordenar la lista">
      <option value="puntaje">Mejor calce</option>
      <option value="reciente">Más recientes</option>
      <option value="titulo">Título A-Z</option>
      <option value="empresa">Empresa A-Z</option>
    </select>
    <a class="btn-excel" href="/api/exportar" title="Descargar Excel con todas tus ofertas">⬇ Excel</a>
  </div>
</header>
<main id="lista"></main>

<script>
// Las ofertas "nuevas" se parten en DOS pestañas segun su puntaje: las que de
// verdad calzan y las genéricas (título de desarrollo pero sin skills concretas,
// porque el portal solo mostraba un resumen corto). Así no se pierde ninguna pero
// la lista principal queda revisable.
const UMBRAL_BUENAS = 3;
const VISTAS = [
  { k:'nueva',      etiqueta:'✨ Nuevas',       ok:o => o.estado==='nueva' && o.puntaje >= UMBRAL_BUENAS },
  { k:'otras',      etiqueta:'📋 Otras nuevas', ok:o => o.estado==='nueva' && o.puntaje <  UMBRAL_BUENAS },
  { k:'guardada',   etiqueta:'⭐ Guardadas',    ok:o => o.estado==='guardada' },
  { k:'postulada',  etiqueta:'✅ Postuladas',   ok:o => o.estado==='postulada' },
  { k:'descartada', etiqueta:'🗑️ Descartadas', ok:o => o.estado==='descartada' },
];
let todas = [];
let filtro = 'nueva';
let texto = ''; // lo que se escribe en el buscador
let orden = 'puntaje';

// "hace 3 días", "hoy", etc. a partir de una fecha ISO.
function fechaRelativa(iso) {
  if (!iso) return '';
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return 'hace ' + dias + ' días';
  const meses = Math.floor(dias / 30);
  return 'hace ' + meses + (meses === 1 ? ' mes' : ' meses');
}

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
  if (o) { o.estado = estado; o.visitada = false; }
  render();
}

// "Visitar oferta": abre el aviso en otra pestaña y deja la oferta marcada como
// visitada, para que al volver al panel aparezca el "¿Postulaste?".
async function visitar(id, url) {
  window.open(url, '_blank');
  await setVisitada(id, true);
}

async function setVisitada(id, val) {
  await fetch('/api/visitar', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id, visitada: val })
  });
  const o = todas.find(x => x.id === id);
  if (o) o.visitada = val;
  render();
}

function esc(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function tarjeta(o) {
  const skills = (o.coincidencias||[]).map(s => '<span class="chip skill">'+esc(s)+'</span>').join('');
  const remoto = o.remoto ? '<span class="chip remoto">Remoto</span>' : '';
  const salario = o.salario ? '<span class="chip">'+esc(o.salario)+'</span>' : '';
  // Búsqueda en Google: título entre comillas + empresa (sin repetir la empresa
  // cuando viene igual al título, si no la búsqueda no encuentra nada).
  const emp = (o.empresa && o.empresa.toLowerCase() !== o.titulo.toLowerCase()) ? ' ' + o.empresa : '';
  const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent('"' + o.titulo + '"' + emp);
  // Computrabajo bloquea el link directo a la oferta (403 anti-bot). Entrando por
  // SU buscador sí funciona, así que "Visitar oferta" abre su listado por título.
  // (solo las primeras palabras: con el título completo el listado sale vacío)
  const slugCt = o.titulo.toLowerCase()
    .normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .split('-').filter(Boolean).slice(0, 4).join('-');
  const abrirUrl = (o.fuente === 'computrabajo')
    ? 'https://cl.computrabajo.com/trabajo-de-' + slugCt
    : o.url;
  let acciones = '';
  if (o.estado === 'nueva' || o.estado === 'guardada') {
    if (o.visitada) {
      // Ya abrió la oferta → le preguntamos si postuló.
      acciones =
        '<span class="pregunta">¿Postulaste a esta oferta?</span>' +
        '<button class="b-post" onclick="accion(\\''+o.id+'\\',\\'postulada\\')">✅ Sí, guardar postulación</button>' +
        '<button class="b-desc" onclick="accion(\\''+o.id+'\\',\\'descartada\\')">🗑️ No, descartar</button>' +
        '<button class="b-volver" onclick="setVisitada(\\''+o.id+'\\',false)">↩ aún no decido</button>';
    } else {
      acciones =
        '<button class="b-post" onclick="visitar(\\''+o.id+'\\',\\''+esc(abrirUrl)+'\\')">🔗 Visitar oferta ↗</button>' +
        (o.estado==='nueva' ? '<button class="b-guard" onclick="accion(\\''+o.id+'\\',\\'guardada\\')">⭐ Guardar</button>' : '') +
        '<button class="b-desc" onclick="accion(\\''+o.id+'\\',\\'descartada\\')">Descartar</button>';
    }
  } else {
    // En Postuladas dejamos botar la oferta si al revisar el aviso no cumple.
    const btnDesc = (o.estado === 'postulada')
      ? '<button class="b-desc" onclick="accion(\\''+o.id+'\\',\\'descartada\\')">🗑️ No cumple, descartar</button>'
      : '';
    acciones = btnDesc +
      '<button class="b-volver" onclick="accion(\\''+o.id+'\\',\\'nueva\\')">↩ Volver a nuevas</button>' +
      '<a class="link" href="'+esc(abrirUrl)+'" target="_blank" style="align-self:center">ver oferta ↗</a>';
  }
  const vista = o.encontrada_en ? '<div class="fecha">🕘 en tu lista ' + fechaRelativa(o.encontrada_en) + '</div>' : '';
  // Salvavidas universal: buscar el aviso en Google por título + empresa.
  const google = '<a class="link-google" target="_blank" href="'+googleUrl+'">🔍 Google</a>';
  return '<div class="card">' +
    '<div class="top"><div>' +
      '<p class="titulo">'+esc(o.titulo)+'</p>' +
      '<p class="empresa">'+esc(o.empresa)+' · '+esc(o.ubicacion)+'</p>' +
    '</div><div class="score">'+o.puntaje+'<small>puntaje</small>'+vista+'</div></div>' +
    '<div class="meta"><span class="chip fuente">'+esc(o.fuente)+'</span>'+remoto+salario+skills+'</div>' +
    '<div class="desc">'+esc((o.descripcion||'').slice(0,320))+'</div>' +
    '<div class="acciones">'+acciones+google+'</div>' +
  '</div>';
}

function render() {
  // pestañas con conteo
  document.getElementById('tabs').innerHTML = VISTAS.map(e => {
    const n = todas.filter(e.ok).length;
    return '<div class="tab '+(filtro===e.k?'activo':'')+'" onclick="setFiltro(\\''+e.k+'\\')">'+
      e.etiqueta+' <span class="n">'+n+'</span></div>';
  }).join('');

  const vista = VISTAS.find(v => v.k === filtro) || VISTAS[0];
  let items = todas.filter(vista.ok);
  // Filtro de texto del buscador (título, empresa, ubicación, skills, fuente).
  if (texto) {
    items = items.filter(o => {
      const heno = (o.titulo+' '+o.empresa+' '+o.ubicacion+' '+(o.coincidencias||[]).join(' ')+' '+o.fuente).toLowerCase();
      return heno.includes(texto);
    });
  }
  // Orden elegido en el selector. "Más recientes" en Postuladas usa la fecha en que
  // postulaste; en el resto, cuándo entró la oferta a tu lista.
  const fechaDe = o => (filtro === 'postulada' ? (o.actualizada_en || '') : (o.encontrada_en || ''));
  if (orden === 'reciente') items.sort((a, b) => fechaDe(b).localeCompare(fechaDe(a)));
  else if (orden === 'titulo') items.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'es'));
  else if (orden === 'empresa') items.sort((a, b) => (a.empresa || '').localeCompare(b.empresa || '', 'es'));
  else items.sort((a, b) => b.puntaje - a.puntaje);

  const contador = document.getElementById('contador');
  contador.textContent = texto ? items.length + ' resultado(s) para "' + texto + '"' : '';

  const lista = document.getElementById('lista');
  if (!items.length) {
    const msg = texto
      ? 'Nada coincide con "' + esc(texto) + '" en esta pestaña.'
      : 'No hay ofertas aquí.<br>' + (filtro==='nueva' ? 'Corre <b>npm run buscar</b> en la terminal, o mira la pestaña <b>Otras nuevas</b>.' : '');
    lista.innerHTML = '<div class="vacio">'+msg+'</div>';
    return;
  }
  lista.innerHTML = items.map(tarjeta).join('');
}

function setFiltro(k){
  filtro = k;
  // En Postuladas conviene ver primero lo último que postulaste.
  orden = (k === 'postulada') ? 'reciente' : 'puntaje';
  const sel = document.getElementById('orden');
  if (sel) sel.value = orden;
  render();
}
function setOrden(v){ orden = v; render(); }
function setBuscar(v){ texto = (v||'').trim().toLowerCase(); render(); }
cargar();
</script>
</body>
</html>`;
}
