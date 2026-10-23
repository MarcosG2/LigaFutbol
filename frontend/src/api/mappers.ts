import type {
  EquipoApi,
  EquipoResumenUi,
  EstadoPartidoApi,
  EstadoPartidoUi,
  FilaTablaApi,
  PartidoApi,
} from './tipos'

const COLORES_ESCUDO = [
  '#1e3a5f',
  '#7f1d1d',
  '#14532d',
  '#854d0e',
  '#0e7490',
  '#4c1d95',
  '#1d4ed8',
  '#0369a1',
  '#57534e',
  '#b45309',
  '#1e40af',
  '#991b1b',
]

export function colorEscudoPorIndice(indice: number): string {
  return COLORES_ESCUDO[indice % COLORES_ESCUDO.length]
}

export function inicialesDeNombre(nombre: string): string {
  return nombre
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function equipoApiAResumen(equipo: EquipoApi, indice = 0): EquipoResumenUi {
  return {
    id: equipo.id,
    nombre: equipo.nombre,
    iniciales: inicialesDeNombre(equipo.nombre) || 'EQ',
    colorEscudo: colorEscudoPorIndice(indice),
    escudoUrl: equipo.escudo_url,
  }
}

export function mapaEquiposPorId(equipos: EquipoApi[]): Map<number, EquipoResumenUi> {
  const mapa = new Map<number, EquipoResumenUi>()
  equipos.forEach((equipo, indice) => {
    mapa.set(equipo.id, equipoApiAResumen(equipo, indice))
  })
  return mapa
}

export function estadoPartidoApiAUi(estado: EstadoPartidoApi | null): EstadoPartidoUi {
  if (estado === 'Jugado') return 'FINALIZADO'
  if (estado === 'Suspendido') return 'EN_JUEGO'
  return 'PROGRAMADO'
}

export function estadoPartidoUiAApi(estado: EstadoPartidoUi): EstadoPartidoApi {
  if (estado === 'FINALIZADO') return 'Jugado'
  if (estado === 'EN_JUEGO') return 'Suspendido'
  return 'Pendiente'
}

export function formatearFechaDia(fechaHora: string | null): string {
  if (!fechaHora) return '—'
  const fecha = new Date(fechaHora)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatearHora(fechaHora: string | null): string {
  if (!fechaHora) return '—'
  const fecha = new Date(fechaHora)
  if (Number.isNaN(fecha.getTime())) return '—'
  return `${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} HS`
}

export function fechaHoraUiAIso(fechaHora: string): string | null {
  if (!fechaHora.trim()) return null
  const fecha = new Date(fechaHora)
  if (Number.isNaN(fecha.getTime())) return null
  return fecha.toISOString()
}

export function filaTablaConPosicion(filas: FilaTablaApi[]) {
  return [...filas]
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
    .map((fila, indice) => ({
      posicion: indice + 1,
      equipo_id: fila.equipo_id,
      equipo: {
        id: fila.equipo_id,
        nombre: fila.nombre,
        iniciales: inicialesDeNombre(fila.nombre),
        colorEscudo: colorEscudoPorIndice(indice),
        escudoUrl: fila.escudo_url ?? null,
      },
      pj: fila.pj,
      pg: fila.pg,
      pe: fila.pe,
      pp: fila.pp,
      gf: fila.gf,
      gc: fila.gc,
      puntos_descontados: fila.puntos_descontados ?? 0,
      pts: fila.pts,
      dg: fila.dg,
    }))
}

export function partidoConNombres(
  partido: PartidoApi,
  mapaEquipos: Map<number, EquipoResumenUi>,
) {
  const local = mapaEquipos.get(partido.equipo_local_id) ?? {
    nombre: `Equipo ${partido.equipo_local_id}`,
    iniciales: '??',
    colorEscudo: '#334155',
  }
  const visitante = mapaEquipos.get(partido.equipo_visitante_id) ?? {
    nombre: `Equipo ${partido.equipo_visitante_id}`,
    iniciales: '??',
    colorEscudo: '#334155',
  }
  return { partido, local, visitante }
}
