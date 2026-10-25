import { ref } from 'vue'
import { cargarContextoTorneoActivo } from './cargarContextoTorneoActivo'
import {
  canchaDePartido,
  formatearFechaDia,
  formatearHora,
  mapaEquiposPorId,
  partidoConNombres,
} from '../api/mappers'
import {
  obtenerNumeroProximaFecha,
  obtenerNumeroUltimaFechaResultados,
  partidosProximaFecha,
  partidosResultadosUltimaJornada,
} from '../api/proximaFecha'
import type { EquipoResumenUi, PartidoApi } from '../api/tipos'
import { useTablaPosiciones } from './useTablaPosiciones'

export type PartidoProximoUi = {
  local: EquipoResumenUi
  visitante: EquipoResumenUi
  hora: string
  cancha: string
  fechaNumero: number
}

export type ResultadoRecienteUi = {
  local: EquipoResumenUi
  visitante: EquipoResumenUi
  golesLocal: number
  golesVisitante: number
  fecha: string
}

export function useDatosInicio() {
  const partidoDestacado = ref<{
    local: EquipoResumenUi
    visitante: EquipoResumenUi
    fechaNumero: number
    dia: string
    hora: string
  } | null>(null)

  const proximosPartidos = ref<PartidoProximoUi[]>([])
  const numeroProximaFecha = ref<number | null>(null)
  const resultadosRecientes = ref<ResultadoRecienteUi[]>([])
  const totalEquipos = ref(0)
  const numeroUltimaFechaJugada = ref<number | null>(null)
  const cargando = ref(false)

  const { filas, cargarTabla } = useTablaPosiciones()

  function ordenarPartidosEnJornada(a: PartidoApi, b: PartidoApi): number {
    const ordenPartido =
      (a.numero_partido ?? Number.MAX_SAFE_INTEGER) -
      (b.numero_partido ?? Number.MAX_SAFE_INTEGER)
    if (ordenPartido !== 0) return ordenPartido
    const tiempoA = a.fecha_hora ? new Date(a.fecha_hora).getTime() : Number.MAX_SAFE_INTEGER
    const tiempoB = b.fecha_hora ? new Date(b.fecha_hora).getTime() : Number.MAX_SAFE_INTEGER
    return tiempoA - tiempoB
  }

  function textoHorarioPartido(partido: PartidoApi): string {
    if (!partido.fecha_hora) return 'FECHA A CONFIRMAR'
    return `${formatearFechaDia(partido.fecha_hora).toUpperCase()} ${formatearHora(partido.fecha_hora)}`
  }

  async function cargarDatosInicio() {
    cargando.value = true
    try {
      const { equipos, partidos } = await cargarContextoTorneoActivo()
      totalEquipos.value = equipos.length
      const mapa = mapaEquiposPorId(equipos)

      const jornadaProxima = obtenerNumeroProximaFecha(partidos)
      const pendientesProximaJornada = partidosProximaFecha(partidos, jornadaProxima).sort(
        ordenarPartidosEnJornada,
      )

      const destacadosPendientes = pendientesProximaJornada.filter((p) => p.destacado_portada)
      const partidoPortada = destacadosPendientes[0] ?? pendientesProximaJornada[0]

      if (partidoPortada) {
        const { local, visitante, partido } = partidoConNombres(partidoPortada, mapa)
        partidoDestacado.value = {
          local,
          visitante,
          fechaNumero: partido.numero_fecha ?? 0,
          dia: partido.fecha_hora
            ? formatearFechaDia(partido.fecha_hora).toUpperCase()
            : 'FECHA A CONFIRMAR',
          hora: partido.fecha_hora ? formatearHora(partido.fecha_hora) : '—',
        }
      } else {
        partidoDestacado.value = null
      }

      numeroProximaFecha.value = jornadaProxima

      proximosPartidos.value = pendientesProximaJornada.map((partido) => {
        const { local, visitante } = partidoConNombres(partido, mapa)
        return {
          local,
          visitante,
          hora: textoHorarioPartido(partido),
          cancha: canchaDePartido(partido.cancha).toUpperCase(),
          fechaNumero: partido.numero_fecha ?? 0,
        }
      })

      const jornadaUltimosResultados = obtenerNumeroUltimaFechaResultados(
        partidos,
        jornadaProxima,
      )
      numeroUltimaFechaJugada.value = jornadaUltimosResultados

      const jugadosUltimaJornada = partidosResultadosUltimaJornada(
        partidos,
        jornadaUltimosResultados,
      )

      resultadosRecientes.value = jugadosUltimaJornada.map((partido) => {
        const { local, visitante } = partidoConNombres(partido, mapa)
        return {
          local,
          visitante,
          golesLocal: partido.goles_local ?? 0,
          golesVisitante: partido.goles_visitante ?? 0,
          fecha: formatearFechaDia(partido.fecha_hora),
        }
      })

      await cargarTabla()
    } finally {
      cargando.value = false
    }
  }

  return {
    partidoDestacado,
    proximosPartidos,
    numeroProximaFecha,
    resultadosRecientes,
    tablaResumen: filas,
    totalEquipos,
    numeroUltimaFechaJugada,
    cargando,
    cargarDatosInicio,
  }
}
