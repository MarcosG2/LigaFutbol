export type EstadoEquipo = 'Activo' | 'Inactivo'
export type EstadoPartidoApi = 'Pendiente' | 'Jugado' | 'Suspendido'
export type EstadoTorneo = 'Activo' | 'Finalizado'
export type EstadoPartidoUi = 'PROGRAMADO' | 'FINALIZADO' | 'EN_JUEGO'

export interface AdministradorPublico {
  id: number
  usuario: string
}

export interface RespuestaLoginApi {
  token: string
  administrador: AdministradorPublico
}

export interface EquipoApi {
  id: number
  nombre: string
  escudo_url: string | null
  instagram: string | null
  estado: EstadoEquipo | null
}

export interface JugadorApi {
  id: number
  equipo_id: number
  nombre: string
  numero_camiseta: number | null
  goles: number | null
}

export interface PartidoApi {
  id: number
  torneo_id: number
  numero_fecha: number | null
  numero_partido: number | null
  equipo_local_id: number
  equipo_visitante_id: number
  goles_local: number | null
  goles_visitante: number | null
  fecha_hora: string | null
  cancha: string | null
  estado: EstadoPartidoApi | null
  destacado_portada: boolean
}

export interface TorneoApi {
  id: number
  nombre: string
  estado: EstadoTorneo | null
}

export interface FilaTablaApi {
  equipo_id: number
  nombre: string
  escudo_url: string | null
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  puntos_descontados: number
  pts: number
  dg: number
}

export interface SancionApi {
  id: number
  torneo_id: number
  equipo_id: number
  nombre_equipo: string
  puntos: number
  motivo: string
  creado_en: string
}

export interface EquipoResumenUi {
  id?: number
  nombre: string
  iniciales: string
  colorEscudo: string
  escudoUrl?: string | null
}
