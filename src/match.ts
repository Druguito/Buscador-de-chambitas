import { OfertaCruda, Oferta, Perfil } from './tipos';
import { generarId } from './store';

// Quita tildes y pasa a minúsculas para comparar sin importar acentos.
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Busca la palabra como término completo (evita que "go" matchee "google").
function contiene(texto: string, palabra: string): boolean {
  const t = normalizar(texto);
  const p = normalizar(palabra).trim();
  if (!p) return false;
  const escapada = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escapada}([^a-z0-9]|$)`, 'i').test(t);
}

export interface Resultado {
  aceptada: boolean;
  motivo?: string;          // por qué se descartó (si aceptada === false)
  puntaje: number;
  coincidencias: string[];
}

// Puntúa una oferta contra el perfil. Sin IA: solo palabras clave.
export function puntuar(oferta: OfertaCruda, perfil: Perfil): Resultado {
  const texto = `${oferta.titulo} ${oferta.descripcion} ${oferta.tags.join(' ')} ${oferta.empresa}`;

  // 1) Filtro de exclusión: si el TÍTULO del cargo contiene algo de "evitar", fuera.
  // OJO: se mira solo el título a propósito. Antes se revisaba todo el aviso y se
  // botaban chambas buenas ("Desarrollador Back-end Junior") solo porque la
  // descripción mencionaba de pasada "el área comercial" de la empresa.
  for (const malo of perfil.evitar) {
    if (contiene(oferta.titulo, malo)) {
      return { aceptada: false, motivo: `el cargo dice "${malo}"`, puntaje: 0, coincidencias: [] };
    }
  }

  // 2) Filtro de remoto (si el usuario solo quiere remoto).
  if (perfil.preferencias.solo_remoto && !oferta.remoto) {
    return { aceptada: false, motivo: 'no es remoto', puntaje: 0, coincidencias: [] };
  }

  // 3) Puntaje = skills encontradas. El título vale doble.
  const coincidencias: string[] = [];
  let puntaje = 0;
  for (const skill of perfil.skills) {
    const enTitulo = contiene(oferta.titulo, skill);
    const enTexto = contiene(texto, skill);
    if (enTitulo || enTexto) {
      coincidencias.push(skill);
      puntaje += enTitulo ? 2 : 1;
    }
  }

  if (puntaje < perfil.puntaje_minimo) {
    return {
      aceptada: false,
      motivo: `puntaje ${puntaje} < mínimo ${perfil.puntaje_minimo}`,
      puntaje,
      coincidencias,
    };
  }

  return { aceptada: true, puntaje, coincidencias };
}

// Convierte una oferta cruda + resultado en una Oferta lista para guardar.
export function aOfertaGuardable(cruda: OfertaCruda, res: Resultado): Oferta {
  const ahora = new Date().toISOString();
  return {
    ...cruda,
    id: generarId(cruda.fuente, cruda.url),
    puntaje: res.puntaje,
    coincidencias: res.coincidencias,
    estado: 'nueva',
    encontrada_en: ahora,
    actualizada_en: ahora,
  };
}
