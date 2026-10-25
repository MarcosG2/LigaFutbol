import { solicitar } from './cliente'

export type CruceGeneradoApi = {
  equipo_local_id: number
  equipo_visitante_id: number
  numero_partido: number
}

export type ResultadoAleatoriosApi = {
  partidos: CruceGeneradoApi[]
  equipo_fecha_libre: { equipo_id: number; nombre: string } | null
}

export type ClasificadoPlayoffApi = {
  posicion: number
  equipo_id: number
  nombre: string
  pts: number
}

export type ResultadoPlayoffsApi = {
  numero_fecha_sugerido: number
  clasificados: ClasificadoPlayoffApi[]
  cruces: CruceGeneradoApi[]
}

export async function generarPartidosAleatoriosFecha(datos: {
  torneo_id: number
  numero_fecha: number
}): Promise<ResultadoAleatoriosApi> {
  return solicitar<ResultadoAleatoriosApi>('/partidos/generar/aleatorios', {
    method: 'POST',
    body: datos,
  })
}

export async function generarEtapaPlayoffs(datos: {
  torneo_id: number
  cantidad_clasificados: number
  formato?: 'estandar' | 'aleatorio'
  clasificados_ids?: number[]
  cruces?: CruceGeneradoApi[]
}): Promise<ResultadoPlayoffsApi> {
  return solicitar<ResultadoPlayoffsApi>('/partidos/generar/playoffs', {
    method: 'POST',
    body: datos,
  })
}
