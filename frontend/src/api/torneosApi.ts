import { ErrorApi } from './cliente'
import { solicitar } from './cliente'
import type { EquipoApi, EstadoTorneo, FilaTablaApi, TorneoApi } from './tipos'

export async function listarTorneos(): Promise<TorneoApi[]> {
  return solicitar<TorneoApi[]>('/torneos')
}

export async function obtenerTorneoPorId(id: number): Promise<TorneoApi> {
  return solicitar<TorneoApi>(`/torneos/${id}`)
}

export async function obtenerTablaTorneo(torneoId: number): Promise<FilaTablaApi[]> {
  return solicitar<FilaTablaApi[]>(`/torneos/${torneoId}/tabla`)
}

export async function crearTorneo(datos: {
  nombre: string
  estado?: EstadoTorneo
}): Promise<TorneoApi> {
  const torneo = await solicitar<TorneoApi>('/torneos', { method: 'POST', body: datos })
  limpiarCacheTorneoActivo()
  return torneo
}

export async function actualizarTorneo(
  id: number,
  datos: Partial<{ nombre: string; estado: EstadoTorneo }>,
): Promise<TorneoApi> {
  const torneo = await solicitar<TorneoApi>(`/torneos/${id}`, { method: 'PUT', body: datos })
  limpiarCacheTorneoActivo()
  return torneo
}

export async function eliminarTorneo(id: number): Promise<void> {
  await solicitar<void>(`/torneos/${id}`, { method: 'DELETE' })
  limpiarCacheTorneoActivo()
}

let torneoActivoCache: TorneoApi | null = null

export async function obtenerTorneoActivo(): Promise<TorneoApi | null> {
  if (torneoActivoCache) return torneoActivoCache
  try {
    torneoActivoCache = await solicitar<TorneoApi>('/torneos/activo')
    return torneoActivoCache
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function listarEquiposDelTorneo(torneoId: number): Promise<EquipoApi[]> {
  return solicitar<EquipoApi[]>(`/torneos/${torneoId}/equipos`)
}

export async function inscribirEquipoEnTorneo(
  torneoId: number,
  equipoId: number,
  joinedFromRound = 1,
): Promise<void> {
  await solicitar(`/torneos/${torneoId}/equipos`, {
    method: 'POST',
    body: { equipo_id: equipoId, joined_from_round: joinedFromRound },
  })
}

export async function retirarEquipoDeTorneo(torneoId: number, equipoId: number): Promise<void> {
  await solicitar<void>(`/torneos/${torneoId}/equipos/${equipoId}`, { method: 'DELETE' })
}

export function limpiarCacheTorneoActivo(): void {
  torneoActivoCache = null
}
