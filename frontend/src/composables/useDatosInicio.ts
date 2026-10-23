import { ref } from 'vue'
import { listarEquipos } from '../api/equiposApi'
import {
  formatearFechaDia,
  formatearHora,
  mapaEquiposPorId,
  partidoConNombres,
} from '../api/mappers'
import { listarPartidos } from '../api/partidosApi'
import type { EquipoResumenUi } from '../api/tipos'
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
  const cargando = ref(false)

  const { filas, cargarTabla } = useTablaPosiciones()

  async function cargarDatosInicio() {
    cargando.value = true
    try {
      const [equipos, partidos] = await Promise.all([listarEquipos(), listarPartidos()])
      const mapa = mapaEquiposPorId(equipos)

      const pendientes = partidos
        .filter((p) => p.estado === 'Pendiente' && p.fecha_hora)
        .sort(
          (a, b) =>
            new Date(a.fecha_hora as string).getTime() - new Date(b.fecha_hora as string).getTime(),
        )

      const jugados = partidos
        .filter((p) => p.estado === 'Jugado')
        .sort(
          (a, b) =>
            new Date(b.fecha_hora as string).getTime() - new Date(a.fecha_hora as string).getTime(),
        )

      const destacadosPendientes = pendientes.filter((p) => p.destacado_portada)
      const partidoPortada = destacadosPendientes[0] ?? pendientes[0]

      if (partidoPortada) {
        const { local, visitante, partido } = partidoConNombres(partidoPortada, mapa)
        partidoDestacado.value = {
          local,
          visitante,
          fechaNumero: partido.numero_fecha ?? 0,
          dia: formatearFechaDia(partido.fecha_hora).toUpperCase(),
          hora: formatearHora(partido.fecha_hora),
        }
      } else {
        partidoDestacado.value = null
      }

      const jornadaProxima = pendientes[0]?.numero_fecha ?? null

      numeroProximaFecha.value = jornadaProxima

      const partidosDeProximaFecha =
        jornadaProxima == null
          ? []
          : pendientes.filter((p) => p.numero_fecha === jornadaProxima)

      partidosDeProximaFecha.sort((a, b) => {
        const ordenPartido =
          (a.numero_partido ?? Number.MAX_SAFE_INTEGER) -
          (b.numero_partido ?? Number.MAX_SAFE_INTEGER)
        if (ordenPartido !== 0) return ordenPartido
        return (
          new Date(a.fecha_hora as string).getTime() - new Date(b.fecha_hora as string).getTime()
        )
      })

      proximosPartidos.value = partidosDeProximaFecha.map((partido) => {
        const { local, visitante } = partidoConNombres(partido, mapa)
        return {
          local,
          visitante,
          hora: `${formatearFechaDia(partido.fecha_hora).toUpperCase()} ${formatearHora(partido.fecha_hora)}`,
          cancha: 'CANCHA 1',
          fechaNumero: partido.numero_fecha ?? 0,
        }
      })

      resultadosRecientes.value = jugados.slice(0, 5).map((partido) => {
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
    cargando,
    cargarDatosInicio,
  }
}
