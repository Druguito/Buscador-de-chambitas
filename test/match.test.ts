import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { puntuar } from '../src/match';
import { OfertaCruda, Perfil } from '../src/tipos';

// Perfil base para las pruebas. Cada test lo ajusta con { ...perfil, loQueCambie }.
const perfil: Perfil = {
  nombre: 'Test',
  busquedas: ['Laravel'],
  skills: ['PHP', 'Laravel', 'Docker', 'Full Stack'],
  evitar: ['Ventas', 'Comercial'],
  preferencias: { solo_remoto: false, ubicaciones: ['Chile'] },
  puntaje_minimo: 1,
  fuentes: { getonboard: true },
};

function oferta(cambios: Partial<OfertaCruda> = {}): OfertaCruda {
  return {
    fuente: 'test',
    titulo: 'Desarrollador Backend',
    empresa: 'Empresa SpA',
    ubicacion: 'Santiago',
    remoto: false,
    url: 'https://ejemplo.cl/1',
    salario: '',
    descripcion: '',
    tags: [],
    ...cambios,
  };
}

describe('puntuar() — filtro de palabras a evitar', () => {
  test('descarta si la palabra prohibida está en el TÍTULO del cargo', () => {
    const r = puntuar(oferta({ titulo: 'Ejecutivo Comercial PHP' }), perfil);
    assert.equal(r.aceptada, false);
    assert.match(r.motivo ?? '', /Comercial/);
  });

  // Este es el caso que nos costó chambas buenas: casi toda empresa menciona su
  // "área comercial" en la descripción, y eso botaba avisos de desarrollo.
  test('NO descarta si la palabra prohibida aparece solo en la DESCRIPCIÓN', () => {
    const r = puntuar(
      oferta({
        titulo: 'Desarrollador Back-end Junior',
        descripcion: 'Trabajarás con el área comercial de la empresa. Stack: PHP y Laravel.',
      }),
      perfil
    );
    assert.equal(r.aceptada, true, 'debería pasar: el cargo no es comercial');
  });

  test('la comparación ignora tildes y mayúsculas', () => {
    const p = { ...perfil, evitar: ['Práctica'] };
    const r = puntuar(oferta({ titulo: 'PRACTICA profesional' }), p);
    assert.equal(r.aceptada, false);
  });
});

describe('puntuar() — puntaje por skills', () => {
  test('una skill en el título vale 2 y en el cuerpo vale 1', () => {
    const soloTitulo = puntuar(oferta({ titulo: 'Desarrollador PHP' }), perfil);
    const soloCuerpo = puntuar(oferta({ descripcion: 'Usamos PHP a diario' }), perfil);
    assert.equal(soloTitulo.puntaje, 2);
    assert.equal(soloCuerpo.puntaje, 1);
  });

  test('suma por cada skill distinta encontrada', () => {
    const r = puntuar(oferta({ titulo: 'Desarrollador PHP Laravel' }), perfil);
    assert.equal(r.puntaje, 4); // PHP (2) + Laravel (2)
    assert.deepEqual(r.coincidencias.sort(), ['Laravel', 'PHP']);
  });

  test('no cuenta una palabra que es parte de otra (Java ≠ JavaScript)', () => {
    const p = { ...perfil, skills: ['Java'] };
    const r = puntuar(oferta({ titulo: 'Desarrollador JavaScript' }), p);
    assert.equal(r.puntaje, 0, 'JavaScript no debería contar como Java');
  });
});

describe('puntuar() — otros filtros', () => {
  test('descarta cuando el puntaje no llega al mínimo', () => {
    const p = { ...perfil, puntaje_minimo: 5 };
    const r = puntuar(oferta({ titulo: 'Desarrollador PHP' }), p); // puntaje 2
    assert.equal(r.aceptada, false);
    assert.match(r.motivo ?? '', /puntaje/);
  });

  test('con solo_remoto activo descarta las presenciales', () => {
    const p = { ...perfil, preferencias: { solo_remoto: true, ubicaciones: [] } };
    const presencial = puntuar(oferta({ titulo: 'Desarrollador PHP', remoto: false }), p);
    const remota = puntuar(oferta({ titulo: 'Desarrollador PHP', remoto: true }), p);
    assert.equal(presencial.aceptada, false);
    assert.equal(remota.aceptada, true);
  });

  test('una oferta sin ninguna skill no pasa', () => {
    const r = puntuar(oferta({ titulo: 'Maestro de techumbre', descripcion: 'Obra' }), perfil);
    assert.equal(r.aceptada, false);
    assert.equal(r.puntaje, 0);
  });
});
