import { cargarPerfil } from './perfil';
import { perfilArg } from './args';
import { puntuar, aOfertaGuardable } from './match';
import { agregarNuevas } from './store';
import { OfertaCruda, Oferta } from './tipos';
import { scrapeGetOnBoard } from './fuentes/getonboard';
import { scrapeComputrabajo } from './fuentes/computrabajo';
import { scrapeChileTrabajos } from './fuentes/chiletrabajos';
import { scrapeTrabajando } from './fuentes/trabajando';
import { scrapeTrabajoOrg } from './fuentes/trabajoorg';
import { scrapeLaborum } from './fuentes/laborum';
import { scrapeBeBee } from './fuentes/bebee';
import { scrapeLinkedIn } from './fuentes/linkedin';

async function main() {
  const nombrePerfil = perfilArg();
  const perfil = cargarPerfil(nombrePerfil);
  console.log(`\n🔎 Buscando chambas para ${perfil.nombre}`);
  if (nombrePerfil) console.log(`   Perfil: ${nombrePerfil} (data/ofertas.${nombrePerfil}.json)`);
  console.log(`   Búsquedas: ${perfil.busquedas.join(', ')}\n`);

  const crudas: OfertaCruda[] = [];

  // Cada fuente se activa/desactiva desde profile.yaml → fuentes.
  if (perfil.fuentes.getonboard) {
    console.log('→ GetOnBoard...');
    crudas.push(...(await scrapeGetOnBoard(perfil.busquedas)));
  }
  if (perfil.fuentes.computrabajo) {
    console.log('→ Computrabajo...');
    crudas.push(...(await scrapeComputrabajo(perfil.busquedas)));
  }
  if (perfil.fuentes.chiletrabajos) {
    console.log('→ ChileTrabajos...');
    crudas.push(...(await scrapeChileTrabajos(perfil.busquedas)));
  }
  if (perfil.fuentes.trabajando) {
    console.log('→ Trabajando.com...');
    crudas.push(...(await scrapeTrabajando(perfil.busquedas)));
  }
  if (perfil.fuentes.trabajoorg) {
    console.log('→ Trabajo.org...');
    crudas.push(...(await scrapeTrabajoOrg(perfil.busquedas)));
  }
  if (perfil.fuentes.laborum) {
    console.log('→ Laborum...');
    crudas.push(...(await scrapeLaborum(perfil.busquedas)));
  }
  if (perfil.fuentes.bebee) {
    console.log('→ beBee...');
    crudas.push(...(await scrapeBeBee(perfil.busquedas)));
  }
  if (perfil.fuentes.linkedin) {
    console.log('→ LinkedIn...');
    const ubic = perfil.preferencias.ubicaciones[0] ?? 'Chile';
    crudas.push(...(await scrapeLinkedIn(perfil.busquedas, ubic)));
  }

  console.log(`\n📥 ${crudas.length} ofertas encontradas en total. Filtrando...`);

  // Puntuar y quedarnos solo con las que pasan el filtro.
  const aceptadas: Oferta[] = [];
  let descartadas = 0;
  for (const cruda of crudas) {
    const res = puntuar(cruda, perfil);
    if (res.aceptada) aceptadas.push(aOfertaGuardable(cruda, res));
    else descartadas++;
  }

  // Ordenar por puntaje (mejores primero) antes de guardar.
  aceptadas.sort((a, b) => b.puntaje - a.puntaje);

  const { agregadas, total, duplicadas } = agregarNuevas(aceptadas, nombrePerfil);

  console.log(`\n✅ Listo:`);
  console.log(`   ${aceptadas.length} calzaron con tu perfil (${descartadas} descartadas por filtro)`);
  if (duplicadas > 0) {
    console.log(`   ${duplicadas} eran la misma oferta en otra página (no se repiten)`);
  }
  console.log(`   ${agregadas} son NUEVAS (no las habías visto antes)`);
  console.log(`   ${total} ofertas en total en tu lista\n`);
  if (agregadas > 0) {
    console.log('👉 Abre el panel para revisarlas:  npm run panel\n');
  } else {
    console.log('   No hubo ofertas nuevas esta vez. Prueba de nuevo más tarde.\n');
  }
}

main().catch((e) => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});
