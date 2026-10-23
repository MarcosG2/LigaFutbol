/** Tipos alineados con el esquema `liga_futbol` (referencia para controllers). */

export type EstadoEquipo = "Activo" | "Inactivo";
export type EstadoPartido = "Pendiente" | "Jugado" | "Suspendido";
export type EstadoTorneo = "Activo" | "Finalizado";

export interface Administrador {
  id: number;
  usuario: string;
  password_hash: string;
}

/** Respuesta pública de administradores (sin credenciales). */
export interface AdministradorPublico {
  id: number;
  usuario: string;
}

export interface Equipo {
  id: number;
  nombre: string;
  escudo_url: string | null;
  instagram: string | null;
  estado: EstadoEquipo | null;
}

export interface Jugador {
  id: number;
  equipo_id: number;
  nombre: string;
  numero_camiseta: number | null;
  goles: number | null;
}

export interface Partido {
  id: number;
  torneo_id: number;
  numero_fecha: number | null;
  numero_partido: number | null;
  equipo_local_id: number;
  equipo_visitante_id: number;
  goles_local: number | null;
  goles_visitante: number | null;
  fecha_hora: Date | null;
  estado: EstadoPartido | null;
  destacado_portada: boolean;
}

export interface Torneo {
  id: number;
  nombre: string;
  estado: EstadoTorneo | null;
}

export interface FilaTablaPosicion {
  equipo_id: number;
  nombre: string;
  escudo_url: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  puntos_descontados: number;
  pts: number;
  dg: number;
}

export interface SancionEquipo {
  id: number;
  torneo_id: number;
  equipo_id: number;
  nombre_equipo: string;
  puntos: number;
  motivo: string;
  creado_en: Date;
}
