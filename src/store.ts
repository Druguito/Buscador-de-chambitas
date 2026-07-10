import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Oferta, Estado } from './tipos';

// Guardamos todo en un simple archivo JSON. Nada de bases de datos ni Docker.
const DIR_DATA = path.join(process.cwd(), 'data');
const RUTA = path.join(DIR_DATA, 'ofertas.json');

function asegurarDir(): void {
  if (!fs.existsSync(DIR_DATA)) fs.mkdirSync(DIR_DATA, { recursive: true });
}

// ID estable a partir de la fuente + URL, para detectar duplicados entre corridas.
export function generarId(fuente: string, url: string): string {
  return crypto.createHash('sha1').update(`${fuente}::${url}`).digest('hex').slice(0, 12);
}

export function cargar(): Oferta[] {
  asegurarDir();
  if (!fs.existsSync(RUTA)) return [];
  try {
    return JSON.parse(fs.readFileSync(RUTA, 'utf8')) as Oferta[];
  } catch {
    return [];
  }
}

export function guardar(ofertas: Oferta[]): void {
  asegurarDir();
  fs.writeFileSync(RUTA, JSON.stringify(ofertas, null, 2), 'utf8');
}

// Agrega solo las ofertas cuyo id aún no existe. Devuelve cuántas eran nuevas.
export function agregarNuevas(nuevas: Oferta[]): { agregadas: number; total: number } {
  const actuales = cargar();
  const idsExistentes = new Set(actuales.map((o) => o.id));
  const aAgregar = nuevas.filter((o) => !idsExistentes.has(o.id));
  const combinadas = [...actuales, ...aAgregar];
  guardar(combinadas);
  return { agregadas: aAgregar.length, total: combinadas.length };
}

export function cambiarEstado(id: string, estado: Estado): boolean {
  const ofertas = cargar();
  const oferta = ofertas.find((o) => o.id === id);
  if (!oferta) return false;
  oferta.estado = estado;
  oferta.actualizada_en = new Date().toISOString();
  guardar(ofertas);
  return true;
}
