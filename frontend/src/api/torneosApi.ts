import { solicitar } from './cliente'
import type { EstadoTorneo, FilaTablaApi, TorneoApi } from './tipos'

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
  const torneos = await listarTorneos()
  torneoActivoCache = torneos.find((t) => t.estado === 'Activo') ?? torneos[0] ?? null
  return torneoActivoCache
}

export function limpiarCacheTorneoActivo(): void {
  torneoActivoCache = null
}
