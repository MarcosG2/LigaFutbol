import type { EstadoPartidoApi, PartidoApi } from './tipos'

/** Partidos que aún deben jugarse en una jornada (solo Pendiente). */
export function esPartidoPorJugar(estado: EstadoPartidoApi | null): boolean {
  return estado === 'Pendiente'
}

/** Jornada cerrada: todos Jugado, Suspendido o Reprogramado. */
export function jornadaTienePartidosPorJugar(partidosDeLaJornada: PartidoApi[]): boolean {
  return partidosDeLaJornada.some((p) => esPartidoPorJugar(p.estado))
}

/**
 * Jornada más alta (última creada) con al menos un partido Pendiente.
 * Evita que pendientes viejos en fechas pasadas tapen la jornada actual.
 */
export function obtenerNumeroProximaFecha(partidos: PartidoApi[]): number | null {
  const porNumero = new Map<number, PartidoApi[]>()

  for (const partido of partidos) {
    const numero = partido.numero_fecha
    if (numero == null || numero <= 0) continue
    const lista = porNumero.get(numero) ?? []
    lista.push(partido)
    porNumero.set(numero, lista)
  }

  for (const numero of [...porNumero.keys()].sort((a, b) => b - a)) {
    if (jornadaTienePartidosPorJugar(porNumero.get(numero)!)) {
      return numero
    }
  }

  return null
}

export function partidosProximaFecha(
  partidos: PartidoApi[],
  numeroJornada: number | null,
): PartidoApi[] {
  if (numeroJornada == null) return []
  return partidos.filter(
    (p) => p.numero_fecha === numeroJornada && esPartidoPorJugar(p.estado),
  )
}

/**
 * Jornada cuyos resultados se muestran en portada: la anterior a la próxima.
 * Si no hay próxima fecha (torneo cerrado), la última jornada con partidos Jugado.
 */
export function obtenerNumeroUltimaFechaResultados(
  partidos: PartidoApi[],
  numeroProximaFecha: number | null,
): number | null {
  const jornadasConJugados = new Set<number>()
  for (const partido of partidos) {
    const numero = partido.numero_fecha
    if (numero != null && numero > 0 && partido.estado === 'Jugado') {
      jornadasConJugados.add(numero)
    }
  }

  if (jornadasConJugados.size === 0) return null

  if (numeroProximaFecha != null && numeroProximaFecha > 1) {
    return numeroProximaFecha - 1
  }

  return Math.max(...jornadasConJugados)
}

const MAX_RESULTADOS_PORTADA = 5

export function partidosResultadosUltimaJornada(
  partidos: PartidoApi[],
  numeroJornada: number | null,
): PartidoApi[] {
  if (numeroJornada == null) return []

  return partidos
    .filter((p) => p.numero_fecha === numeroJornada && p.estado === 'Jugado')
    .sort((a, b) => {
      const ordenPartido =
        (a.numero_partido ?? Number.MAX_SAFE_INTEGER) -
        (b.numero_partido ?? Number.MAX_SAFE_INTEGER)
      if (ordenPartido !== 0) return ordenPartido
      const tiempoA = a.fecha_hora ? new Date(a.fecha_hora).getTime() : 0
      const tiempoB = b.fecha_hora ? new Date(b.fecha_hora).getTime() : 0
      return tiempoB - tiempoA
    })
    .slice(0, MAX_RESULTADOS_PORTADA)
}
