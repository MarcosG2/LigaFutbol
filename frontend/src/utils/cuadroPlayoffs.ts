import { colorEscudoPorIndice, inicialesDeNombre } from '../api/mappers'
import type { EquipoResumenUi, PartidoApi } from '../api/tipos'

export type SlotCuadro = {
  equipoId: number | null
  nombre: string
  esGanador: boolean
  escudoUrl: string | null
  iniciales: string
  colorEscudo: string
}

export type PartidoCuadro = {
  partidoId: number | null
  local: SlotCuadro
  visitante: SlotCuadro
  jugado: boolean
}

export type RondaCuadro = {
  titulo: string
  partidos: PartidoCuadro[]
}

function tituloPorEquiposEnRonda(cantidadEquipos: number): string {
  if (cantidadEquipos >= 16) return 'Octavos'
  if (cantidadEquipos >= 8) return 'Cuartos'
  if (cantidadEquipos >= 4) return 'Semis'
  return 'Final'
}

function partidoJugado(partido: PartidoApi): boolean {
  return partido.estado === 'Jugado'
}

function slotDesdeEquipoId(
  equipoId: number,
  equipos: Map<number, EquipoResumenUi>,
  esGanador: boolean,
): SlotCuadro {
  const equipo = equipos.get(equipoId)
  if (equipo) {
    return {
      equipoId,
      nombre: equipo.nombre,
      esGanador,
      escudoUrl: equipo.escudoUrl,
      iniciales: equipo.iniciales,
      colorEscudo: equipo.colorEscudo,
    }
  }
  const nombre = `Equipo ${equipoId}`
  return {
    equipoId,
    nombre,
    esGanador,
    escudoUrl: null,
    iniciales: inicialesDeNombre(nombre) || 'EQ',
    colorEscudo: colorEscudoPorIndice(equipoId),
  }
}

function slotVacio(): SlotCuadro {
  return {
    equipoId: null,
    nombre: '—',
    esGanador: false,
    escudoUrl: null,
    iniciales: '—',
    colorEscudo: '#334155',
  }
}

function partidoApiACuadro(
  partido: PartidoApi,
  equipos: Map<number, EquipoResumenUi>,
): PartidoCuadro {
  const jugado = partidoJugado(partido)
  const gl = partido.goles_local
  const gv = partido.goles_visitante
  const hayResultado =
    jugado && gl !== null && gv !== null && gl !== gv
  const localGana = hayResultado && gl > gv
  const visitanteGana = hayResultado && gv > gl

  return {
    partidoId: partido.id,
    jugado,
    local: slotDesdeEquipoId(partido.equipo_local_id, equipos, localGana),
    visitante: slotDesdeEquipoId(partido.equipo_visitante_id, equipos, visitanteGana),
  }
}

function ganadorDePartidoCuadro(partido: PartidoCuadro): SlotCuadro | null {
  if (!partido.jugado) return null
  if (partido.local.esGanador) return partido.local
  if (partido.visitante.esGanador) return partido.visitante
  return null
}

/** Agrupa partidos de playoff por fecha (cada fecha = una ronda del cuadro). */
function rondasDesdePartidos(partidosPlayoff: PartidoApi[]): PartidoApi[][] {
  const porFecha = new Map<number, PartidoApi[]>()
  for (const partido of partidosPlayoff) {
    const numero = partido.numero_fecha ?? 0
    const lista = porFecha.get(numero) ?? []
    lista.push(partido)
    porFecha.set(numero, lista)
  }

  return [...porFecha.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, lista]) =>
      [...lista].sort((a, b) => {
        const na = a.numero_partido ?? Number.MAX_SAFE_INTEGER
        const nb = b.numero_partido ?? Number.MAX_SAFE_INTEGER
        return na - nb || a.id - b.id
      }),
    )
}

export function construirCuadroPlayoffs(
  partidos: PartidoApi[],
  equiposPorId: Map<number, EquipoResumenUi>,
): { rondas: RondaCuadro[]; hayPlayoffs: boolean } {
  const playoff = partidos.filter((p) => p.es_playoff)
  if (playoff.length === 0) {
    return { rondas: [], hayPlayoffs: false }
  }

  const rondasApi = rondasDesdePartidos(playoff)
  const equiposIniciales = rondasApi[0].length * 2
  if (equiposIniciales < 2 || (equiposIniciales & (equiposIniciales - 1)) !== 0) {
    return { rondas: [], hayPlayoffs: false }
  }

  const cantidadRondas = Math.log2(equiposIniciales)
  const cuadro: PartidoCuadro[][] = []

  for (let r = 0; r < cantidadRondas; r++) {
    const partidosEnRonda = equiposIniciales / Math.pow(2, r + 1)
    const fila: PartidoCuadro[] = []

    for (let m = 0; m < partidosEnRonda; m++) {
      const apiRonda = rondasApi[r]
      const partidoApi = apiRonda?.[m]
      if (partidoApi) {
        fila.push(partidoApiACuadro(partidoApi, equiposPorId))
      } else {
        fila.push({
          partidoId: null,
          jugado: false,
          local: slotVacio(),
          visitante: slotVacio(),
        })
      }
    }
    cuadro.push(fila)
  }

  for (let r = 0; r < cuadro.length - 1; r++) {
    const siguiente = cuadro[r + 1]
    for (let m = 0; m < siguiente.length; m++) {
      const destino = siguiente[m]
      const tieneDatosApi = destino.partidoId !== null
      if (tieneDatosApi) continue

      const origenA = cuadro[r][m * 2]
      const origenB = cuadro[r][m * 2 + 1]
      const ganA = ganadorDePartidoCuadro(origenA)
      const ganB = ganadorDePartidoCuadro(origenB)

      if (ganA?.equipoId) {
        destino.local = { ...ganA, esGanador: false }
      }
      if (ganB?.equipoId) {
        destino.visitante = { ...ganB, esGanador: false }
      }
    }
  }

  const rondas: RondaCuadro[] = cuadro.map((partidosRonda, indice) => {
    const equiposEnRonda = equiposIniciales / Math.pow(2, indice)
    return {
      titulo: tituloPorEquiposEnRonda(equiposEnRonda),
      partidos: partidosRonda,
    }
  })

  return { rondas, hayPlayoffs: true }
}
