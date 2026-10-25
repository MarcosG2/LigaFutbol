import { solicitar } from './cliente'
import type { SancionApi } from './tipos'

export async function listarSancionesTorneo(torneoId: number): Promise<SancionApi[]> {
  return solicitar<SancionApi[]>(`/torneos/${torneoId}/sanciones`)
}

export async function registrarSancionTorneo(
  torneoId: number,
  datos: { equipo_id: number; puntos: number; motivo: string },
): Promise<SancionApi> {
  return solicitar<SancionApi>(`/torneos/${torneoId}/sanciones`, {
    method: 'POST',
    body: datos,
  })
}

export async function actualizarSancionTorneo(
  torneoId: number,
  sancionId: number,
  datos: { equipo_id?: number; puntos?: number; motivo?: string },
): Promise<SancionApi> {
  return solicitar<SancionApi>(`/torneos/${torneoId}/sanciones/${sancionId}`, {
    method: 'PUT',
    body: datos,
  })
}

export async function eliminarSancionTorneo(
  torneoId: number,
  sancionId: number,
): Promise<void> {
  await solicitar<void>(`/torneos/${torneoId}/sanciones/${sancionId}`, {
    method: 'DELETE',
  })
}
