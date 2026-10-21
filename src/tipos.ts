// Tipos compartidos por toda la app.

export type Estado = 'nueva' | 'guardada' | 'postulada' | 'descartada';

// Oferta tal como la devuelve una fuente, antes de puntuar y guardar.
export interface OfertaCruda {
  fuente: string;        // getonboard | chiletrabajos | computrabajo | trabajando | linkedin
  titulo: string;
  empresa: string;
  ubicacion: string;
  remoto: boolean;
  url: string;           // enlace para postular / ver la oferta
  salario: string;       // texto libre, "" si no informa
  descripcion: string;   // texto plano (sin HTML)
  tags: string[];
}

// Oferta ya guardada en data/ofertas.json
export interface Oferta extends OfertaCruda {
  id: string;                // hash estable (fuente + url)
  puntaje: number;
  coincidencias: string[];   // skills encontradas
  estado: Estado;
  encontrada_en: string;     // ISO date, primera vez que se vio
  actualizada_en: string;    // ISO date, último cambio de estado
  visitada?: boolean;        // true si ya abrió la oferta (para preguntar "¿postulaste?")
}

export interface Perfil {
  nombre: string;
  busquedas: string[];
  skills: string[];
  evitar: string[];
  preferencias: {
    solo_remoto: boolean;
    ubicaciones: string[];
  };
  puntaje_minimo: number;
  fuentes: Record<string, boolean>;
}
