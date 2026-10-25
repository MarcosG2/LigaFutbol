import { solicitar } from './cliente'
import type { EstadoPartidoApi, PartidoApi } from './tipos'

export async function listarPartidos(): Promise<PartidoApi[]> {
  return solicitar<PartidoApi[]>('/partidos')
}

export async function crearPartido(datos: {
  torneo_id: number
  numero_fecha?: number | null
  numero_partido?: number | null
  equipo_local_id: number
  equipo_visitante_id: number
  goles_local?: number | null
  goles_visitante?: number | null
  fecha_hora?: string | null
  estado?: EstadoPartidoApi
  destacado_portada?: boolean
  es_playoff?: boolean
}): Promise<PartidoApi> {
  return solicitar<PartidoApi>('/partidos', { method: 'POST', body: datos })
}

export async function actualizarPartido(
  id: number,
  datos: Partial<{
    torneo_id: number
    numero_fecha: number | null
    numero_partido: number | null
    equipo_local_id: number
    equipo_visitante_id: number
    goles_local: number | null
    goles_visitante: number | null
    fecha_hora: string | null
    estado: EstadoPartidoApi
    destacado_portada: boolean
    es_playoff: boolean
  }>,
): Promise<PartidoApi> {
  return solicitar<PartidoApi>(`/partidos/${id}`, { method: 'PUT', body: datos })
}

export async function eliminarPartido(id: number): Promise<void> {
  return solicitar<void>(`/partidos/${id}`, { method: 'DELETE' })
}
