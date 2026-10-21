import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Oferta, Estado } from './tipos';

// Guardamos todo en un simple archivo JSON. Nada de bases de datos ni Docker.
const DIR_DATA = path.join(process.cwd(), 'data');

// Cada perfil tiene su propio archivo de datos (así no se mezclan las listas).
//   rutaDatos()      → data/ofertas.json        (perfil por defecto)
//   rutaDatos('qa')  → data/ofertas.qa.json
function rutaDatos(perfil?: string): string {
  const archivo = perfil ? `ofertas.${perfil}.json` : 'ofertas.json';
  return path.join(DIR_DATA, archivo);
}

function asegurarDir(): void {
  if (!fs.existsSync(DIR_DATA)) fs.mkdirSync(DIR_DATA, { recursive: true });
}

// ID estable a partir de la fuente + URL, para detectar duplicados entre corridas.
export function generarId(fuente: string, url: string): string {
  return crypto.createHash('sha1').update(`${fuente}::${url}`).digest('hex').slice(0, 12);
}

// Huella de CONTENIDO (título + empresa, sin tildes/mayúsculas/símbolos), para
// detectar la MISMA oferta publicada en páginas distintas (misma chamba en
// GetOnBoard y en Trabajando = distinto id, pero misma huella → no duplicar).
export function claveContenido(titulo: string, empresa: string): string {
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // tildes
      .replace(/[^a-z0-9]+/g, ' ')     // símbolos → espacio
      .trim();
  return `${norm(titulo)}|${norm(empresa)}`;
}

export function cargar(perfil?: string): Oferta[] {
  asegurarDir();
  const ruta = rutaDatos(perfil);
  if (!fs.existsSync(ruta)) return [];
  try {
    return JSON.parse(fs.readFileSync(ruta, 'utf8')) as Oferta[];
  } catch {
    return [];
  }
}

export function guardar(ofertas: Oferta[], perfil?: string): void {
  asegurarDir();
  fs.writeFileSync(rutaDatos(perfil), JSON.stringify(ofertas, null, 2), 'utf8');
}

// Agrega solo las ofertas realmente nuevas. Descarta dos tipos:
//  - las ya vistas (mismo id = misma fuente+url, de una corrida anterior), y
//  - las repetidas de otra página (misma huella de contenido título+empresa).
// Devuelve cuántas se agregaron y cuántas se saltaron por ser duplicado entre páginas.
export function agregarNuevas(
  nuevas: Oferta[],
  perfil?: string
): {
  agregadas: number;
  total: number;
  duplicadas: number;
} {
  const actuales = cargar(perfil);
  const idsExistentes = new Set(actuales.map((o) => o.id));
  const clavesExistentes = new Set(actuales.map((o) => claveContenido(o.titulo, o.empresa)));

  const aAgregar: Oferta[] = [];
  let duplicadas = 0;
  for (const o of nuevas) {
    if (idsExistentes.has(o.id)) continue; // ya la teníamos (misma fuente+url).
    const clave = claveContenido(o.titulo, o.empresa);
    if (clavesExistentes.has(clave)) {
      duplicadas++; // misma oferta que otra ya guardada, pero en otra página.
      continue;
    }
    clavesExistentes.add(clave);
    aAgregar.push(o);
  }

  const combinadas = [...actuales, ...aAgregar];
  guardar(combinadas, perfil);
  return { agregadas: aAgregar.length, total: combinadas.length, duplicadas };
}

export function cambiarEstado(id: string, estado: Estado, perfil?: string): boolean {
  const ofertas = cargar(perfil);
  const oferta = ofertas.find((o) => o.id === id);
  if (!oferta) return false;
  oferta.estado = estado;
  // Al decidir (postular/descartar/volver), ya no está "pendiente de confirmar".
  oferta.visitada = false;
  oferta.actualizada_en = new Date().toISOString();
  guardar(ofertas, perfil);
  return true;
}

// Marca (o desmarca) que el usuario abrió la oferta, para luego preguntarle
// "¿postulaste?" al volver al panel.
export function marcarVisitada(id: string, visitada: boolean, perfil?: string): boolean {
  const ofertas = cargar(perfil);
  const oferta = ofertas.find((o) => o.id === id);
  if (!oferta) return false;
  oferta.visitada = visitada;
  guardar(ofertas, perfil);
  return true;
}
