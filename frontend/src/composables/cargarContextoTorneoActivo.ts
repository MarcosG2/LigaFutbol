import { listarPartidos } from '../api/partidosApi'
import type { EquipoApi, PartidoApi, TorneoApi } from '../api/tipos'
import { listarEquiposDelTorneo, obtenerTorneoActivo } from '../api/torneosApi'

export type ContextoTorneoActivo = {
  torneo: TorneoApi | null
  partidos: PartidoApi[]
  equipos: EquipoApi[]
}

export async function cargarContextoTorneoActivo(): Promise<ContextoTorneoActivo> {
  const torneo = await obtenerTorneoActivo()
  if (!torneo) {
    return { torneo: null, partidos: [], equipos: [] }
  }

  const [partidos, equipos] = await Promise.all([
    listarPartidos(torneo.id),
    listarEquiposDelTorneo(torneo.id),
  ])

  return { torneo, partidos, equipos }
}
