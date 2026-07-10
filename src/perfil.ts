import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Perfil } from './tipos';

const RUTA_PERFIL = path.join(process.cwd(), 'profile.yaml');

// Carga y valida (suavemente) el profile.yaml del usuario.
export function cargarPerfil(): Perfil {
  if (!fs.existsSync(RUTA_PERFIL)) {
    throw new Error(
      'No encontré profile.yaml. Copia profile.example.yaml a profile.yaml y edítalo.'
    );
  }

  const bruto = yaml.load(fs.readFileSync(RUTA_PERFIL, 'utf8')) as Partial<Perfil>;

  return {
    nombre: bruto.nombre ?? 'Sin nombre',
    busquedas: bruto.busquedas ?? [],
    skills: bruto.skills ?? [],
    evitar: bruto.evitar ?? [],
    preferencias: {
      solo_remoto: bruto.preferencias?.solo_remoto ?? false,
      ubicaciones: bruto.preferencias?.ubicaciones ?? [],
    },
    puntaje_minimo: bruto.puntaje_minimo ?? 1,
    fuentes: bruto.fuentes ?? { getonboard: true },
  };
}
