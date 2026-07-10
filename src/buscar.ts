import { cargarPerfil } from './perfil';
import { puntuar, aOfertaGuardable } from './match';
import { agregarNuevas } from './store';
import { OfertaCruda, Oferta } from './tipos';
import { scrapeGetOnBoard } from './fuentes/getonboard';
import { scrapeComputrabajo } from './fuentes/computrabajo';
import { scrapeChileTrabajos } from './fuentes/chiletrabajos';
import { scrapeLinkedIn } from './fuentes/linkedin';

async function main() {
  const perfil = cargarPerfil();
  console.log(`\n🔎 Buscando chambas para ${perfil.nombre}`);
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

  const { agregadas, total } = agregarNuevas(aceptadas);

  console.log(`\n✅ Listo:`);
  console.log(`   ${aceptadas.length} calzaron con tu perfil (${descartadas} descartadas por filtro)`);
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
