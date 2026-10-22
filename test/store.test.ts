import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { generarId, claveContenido, agregarNuevas, cargar, cambiarEstado, marcarVisitada } from '../src/store';
import { Oferta } from '../src/tipos';

// IMPORTANTE: todos los tests que escriben usan el perfil "__test", así tocan
// data/ofertas.__test.json y nunca la lista real del usuario.
const PERFIL = '__test';
const RUTA = path.join(process.cwd(), 'data', `ofertas.${PERFIL}.json`);

function limpiar() {
  if (fs.existsSync(RUTA)) fs.unlinkSync(RUTA);
}
afterEach(limpiar);

function oferta(cambios: Partial<Oferta> = {}): Oferta {
  const base: Oferta = {
    fuente: 'test',
    titulo: 'Desarrollador PHP',
    empresa: 'Acme SpA',
    ubicacion: 'Santiago',
    remoto: false,
    url: 'https://ejemplo.cl/1',
    salario: '',
    descripcion: '',
    tags: [],
    id: '',
    puntaje: 3,
    coincidencias: [],
    estado: 'nueva',
    encontrada_en: new Date().toISOString(),
    actualizada_en: new Date().toISOString(),
    ...cambios,
  };
  base.id = base.id || generarId(base.fuente, base.url);
  return base;
}

describe('generarId()', () => {
  test('es estable: la misma fuente y url dan siempre el mismo id', () => {
    assert.equal(generarId('getonboard', 'https://x.cl/1'), generarId('getonboard', 'https://x.cl/1'));
  });

  test('cambia si cambia la url o la fuente', () => {
    assert.notEqual(generarId('getonboard', 'https://x.cl/1'), generarId('getonboard', 'https://x.cl/2'));
    assert.notEqual(generarId('getonboard', 'https://x.cl/1'), generarId('linkedin', 'https://x.cl/1'));
  });
});

describe('claveContenido()', () => {
  test('ignora tildes, mayúsculas y símbolos', () => {
    assert.equal(
      claveContenido('Programador Sénior', 'Acme S.A.'),
      claveContenido('programador senior', 'ACME SA')
    );
  });

  test('distingue ofertas realmente distintas', () => {
    assert.notEqual(claveContenido('Backend', 'Acme'), claveContenido('Frontend', 'Acme'));
  });
});

describe('agregarNuevas()', () => {
  test('guarda las ofertas nuevas', () => {
    const r = agregarNuevas([oferta()], PERFIL);
    assert.equal(r.agregadas, 1);
    assert.equal(r.total, 1);
    assert.equal(cargar(PERFIL).length, 1);
  });

  test('no vuelve a agregar una oferta ya vista (mismo id)', () => {
    agregarNuevas([oferta()], PERFIL);
    const r = agregarNuevas([oferta()], PERFIL); // la misma de nuevo
    assert.equal(r.agregadas, 0);
    assert.equal(r.total, 1);
  });

  // La misma chamba publicada en dos portales: distinta url (distinto id) pero
  // mismo título + empresa. Debe guardarse una sola vez.
  test('dedupe entre portales: misma chamba, distinta fuente', () => {
    agregarNuevas([oferta({ fuente: 'getonboard', url: 'https://a.cl/1' })], PERFIL);
    const r = agregarNuevas([oferta({ fuente: 'laborum', url: 'https://b.cl/9' })], PERFIL);
    assert.equal(r.agregadas, 0);
    assert.equal(r.duplicadas, 1);
    assert.equal(r.total, 1);
  });
});

describe('cambiarEstado() y marcarVisitada()', () => {
  test('cambiar estado lo persiste y limpia la marca de visitada', () => {
    const o = oferta();
    agregarNuevas([o], PERFIL);
    marcarVisitada(o.id, true, PERFIL);
    assert.equal(cargar(PERFIL)[0].visitada, true);

    assert.equal(cambiarEstado(o.id, 'postulada', PERFIL), true);
    const guardada = cargar(PERFIL)[0];
    assert.equal(guardada.estado, 'postulada');
    assert.equal(guardada.visitada, false, 'al decidir ya no queda pendiente de confirmar');
  });

  test('devuelve false si el id no existe', () => {
    assert.equal(cambiarEstado('noexiste', 'postulada', PERFIL), false);
  });
});
