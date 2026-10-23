import { solicitar } from './cliente'
import type { JugadorApi } from './tipos'

export async function listarJugadores(equipoId?: number): Promise<JugadorApi[]> {
  const query = equipoId !== undefined ? `?equipo_id=${equipoId}` : ''
  return solicitar<JugadorApi[]>(`/jugadores${query}`)
}

export async function crearJugador(datos: {
  equipo_id: number
  nombre: string
  numero_camiseta?: number | null
  goles?: number | null
}): Promise<JugadorApi> {
  return solicitar<JugadorApi>('/jugadores', { method: 'POST', body: datos })
}

export async function actualizarJugador(
  id: number,
  datos: Partial<{
    equipo_id: number
    nombre: string
    numero_camiseta: number | null
    goles: number | null
  }>,
): Promise<JugadorApi> {
  return solicitar<JugadorApi>(`/jugadores/${id}`, { method: 'PUT', body: datos })
}

export async function eliminarJugador(id: number): Promise<void> {
  return solicitar<void>(`/jugadores/${id}`, { method: 'DELETE' })
}
