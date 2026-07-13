import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Perfil } from './tipos';

// Nombre del archivo de perfil según el perfil elegido (undefined = el default).
//   cargarPerfil()        → profile.yaml
//   cargarPerfil('qa')    → profile.qa.yaml
function rutaPerfil(perfil?: string): string {
  const archivo = perfil ? `profile.${perfil}.yaml` : 'profile.yaml';
  return path.join(process.cwd(), archivo);
}

// Carga y valida (suavemente) el profile del usuario.
export function cargarPerfil(perfil?: string): Perfil {
  const ruta = rutaPerfil(perfil);
  if (!fs.existsSync(ruta)) {
    const archivo = perfil ? `profile.${perfil}.yaml` : 'profile.yaml';
    throw new Error(
      `No encontré ${archivo}. Copia profile.example.yaml a ${archivo} y edítalo.`
    );
  }

  const bruto = yaml.load(fs.readFileSync(ruta, 'utf8')) as Partial<Perfil>;

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
