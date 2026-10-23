import { solicitar } from './cliente'
import type { EquipoApi } from './tipos'

export async function listarEquipos(): Promise<EquipoApi[]> {
  return solicitar<EquipoApi[]>('/equipos')
}

export type JugadorPlantillaEquipoApi = {
  nombre: string
  numero_camiseta: number
}

export async function crearEquipo(datos: {
  nombre: string
  escudo_url?: string | null
  instagram?: string | null
  estado?: 'Activo' | 'Inactivo'
  jugadores?: JugadorPlantillaEquipoApi[]
}): Promise<EquipoApi> {
  return solicitar<EquipoApi>('/equipos', { method: 'POST', body: datos })
}

export async function actualizarEquipo(
  id: number,
  datos: Partial<{
    nombre: string
    escudo_url: string | null
    instagram: string | null
    estado: 'Activo' | 'Inactivo'
  }>,
): Promise<EquipoApi> {
  return solicitar<EquipoApi>(`/equipos/${id}`, { method: 'PUT', body: datos })
}

export async function eliminarEquipo(id: number): Promise<void> {
  return solicitar<void>(`/equipos/${id}`, { method: 'DELETE' })
}

export async function subirEscudoEquipo(id: number, archivo: File): Promise<EquipoApi> {
  const formulario = new FormData()
  formulario.append('escudo', archivo)
  return solicitar<EquipoApi>(`/equipos/${id}/escudo`, {
    method: 'POST',
    body: formulario,
  })
}
