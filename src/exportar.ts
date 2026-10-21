import fs from 'fs';
import path from 'path';
import { cargar } from './store';
import { perfilArg } from './args';
import { Oferta } from './tipos';

// Genera un CSV que Excel (en español) abre directo en columnas.
// Usamos ';' como separador (el que espera el Excel en es-CL) y un BOM al inicio
// para que respete las tildes.

const COLUMNAS = ['N°', 'Título', 'Empresa', 'Fuente', 'Ubicación', 'Puntaje', 'Estado', '¿Postulaste? (SI/NO)', 'Link'];

// Escapa un campo para CSV: si tiene ; " o salto de línea, se encierra en comillas.
function campo(valor: string | number): string {
  const s = String(valor ?? '');
  if (/[;"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function generarCsv(ofertas: Oferta[]): string {
  // No exportamos las descartadas (no sirven para postular).
  const utiles = ofertas
    .filter((o) => o.estado !== 'descartada')
    .sort((a, b) => b.puntaje - a.puntaje);

  const lineas = [COLUMNAS.join(';')];
  utiles.forEach((o, i) => {
    const yaPostulada = o.estado === 'postulada' ? 'SI' : '';
    lineas.push(
      [
        i + 1,
        campo(o.titulo),
        campo(o.empresa),
        o.fuente,
        campo(o.ubicacion),
        o.puntaje,
        o.estado,
        yaPostulada,
        campo(o.url),
      ].join(';')
    );
  });

  // BOM (﻿) para que Excel lea bien las tildes.
  return '﻿' + lineas.join('\r\n');
}

// Uso por terminal:  npm run exportar   (o  -- --perfil juan)
function main() {
  const perfil = perfilArg();
  const ofertas = cargar(perfil);
  const csv = generarCsv(ofertas);
  const nombre = perfil ? `ofertas.${perfil}.csv` : 'ofertas.csv';
  const ruta = path.join(process.cwd(), 'data', nombre);
  fs.writeFileSync(ruta, csv, 'utf8');
  const cuantas = csv.split('\r\n').length - 1; // menos la cabecera
  console.log(`\n📊 Exportadas ${cuantas} ofertas a:`);
  console.log(`   ${ruta}`);
  console.log(`   Ábrelo con Excel (doble clic). Descartadas no se incluyen.\n`);
}

if (require.main === module) main();
