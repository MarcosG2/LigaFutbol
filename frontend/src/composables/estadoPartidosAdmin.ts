import { computed, ref, watch } from 'vue'
import {
  canchaDePartido,
  estadoPartidoApiAUi,
  estadoPartidoUiAApi,
  fechaHoraUiAIso,
} from '../api/mappers'
import { listarEquipos } from '../api/equiposApi'
import {
  actualizarPartido,
  crearPartido,
  eliminarPartido,
  listarPartidos,
} from '../api/partidosApi'
import type { PartidoApi } from '../api/tipos'
import { obtenerTorneoActivo } from '../api/torneosApi'

export type EstadoPartido = 'PROGRAMADO' | 'FINALIZADO' | 'EN_JUEGO'

export type PartidoAdmin = {
  id: number
  numero_partido: number | null
  local: string
  visitante: string
  equipo_local_id: number
  equipo_visitante_id: number
  fecha_hora: string
  cancha: string
  estado: EstadoPartido
  goles_local: number | null
  goles_visitante: number | null
  destacado_portada: boolean
}

export type FechaTorneoAdmin = {
  id_fecha: number
  numero: number
  partidos: PartidoAdmin[]
}

export type NotificacionPartidoFinalizado = {
  idPartido: number
  numeroFecha: number
  local: string
  visitante: string
  golesLocal: number
  golesVisitante: number
  fechaHora: string
}

const CLAVE_NOTIFICACIONES_LEIDAS = 'plu-notificaciones-partidos-leidas'
export const fechasPartidosAdmin = ref<FechaTorneoAdmin[]>([])
export const cargandoPartidosAdmin = ref(false)

const mapaNombresEquipos = ref<Map<number, string>>(new Map())

function cargarIdsLeidos(): Set<number> {
  try {
    const raw = localStorage.getItem(CLAVE_NOTIFICACIONES_LEIDAS)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as number[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function guardarIdsLeidos(ids: Set<number>) {
  localStorage.setItem(CLAVE_NOTIFICACIONES_LEIDAS, JSON.stringify([...ids]))
}

const idsNotificacionesLeidas = ref<Set<number>>(cargarIdsLeidos())

function partidoApiAAdmin(partido: PartidoApi): PartidoAdmin {
  const nombreLocal =
    mapaNombresEquipos.value.get(partido.equipo_local_id) ?? `Equipo ${partido.equipo_local_id}`
  const nombreVisitante =
    mapaNombresEquipos.value.get(partido.equipo_visitante_id) ??
    `Equipo ${partido.equipo_visitante_id}`

  let fechaHoraUi = ''
  if (partido.fecha_hora) {
    const fecha = new Date(partido.fecha_hora)
    if (!Number.isNaN(fecha.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0')
      fechaHoraUi = `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
    }
  }

  return {
    id: partido.id,
    numero_partido: partido.numero_partido,
    local: nombreLocal,
    visitante: nombreVisitante,
    equipo_local_id: partido.equipo_local_id,
    equipo_visitante_id: partido.equipo_visitante_id,
    fecha_hora: fechaHoraUi,
    cancha: canchaDePartido(partido.cancha),
    estado: estadoPartidoApiAUi(partido.estado),
    goles_local: partido.goles_local,
    goles_visitante: partido.goles_visitante,
    destacado_portada: Boolean(partido.destacado_portada),
  }
}

function compararPartidosEnFecha(a: PartidoAdmin, b: PartidoAdmin): number {
  const ordenA = a.numero_partido ?? Number.MAX_SAFE_INTEGER
  const ordenB = b.numero_partido ?? Number.MAX_SAFE_INTEGER
  if (ordenA !== ordenB) return ordenA - ordenB
  return a.id - b.id
}

function agruparPartidos(partidos: PartidoApi[]): FechaTorneoAdmin[] {
  const porNumero = new Map<number, PartidoAdmin[]>()

  for (const partido of partidos) {
    const numero = partido.numero_fecha ?? 0
    const lista = porNumero.get(numero) ?? []
    lista.push(partidoApiAAdmin(partido))
    porNumero.set(numero, lista)
  }

  return [...porNumero.entries()]
    .sort(([a], [b]) => a - b)
    .map(([numero, listaPartidos]) => ({
      id_fecha: numero,
      numero,
      partidos: listaPartidos.sort(compararPartidosEnFecha),
    }))
}

export async function cargarPartidosAdmin(): Promise<void> {
  cargandoPartidosAdmin.value = true
  try {
    const equipos = await listarEquipos()
    mapaNombresEquipos.value = new Map(equipos.map((e) => [e.id, e.nombre]))
    const partidos = await listarPartidos()
    fechasPartidosAdmin.value = agruparPartidos(partidos)
  } finally {
    cargandoPartidosAdmin.value = false
  }
}

function nombreAIdEquipo(nombre: string): number | null {
  for (const [id, nom] of mapaNombresEquipos.value.entries()) {
    if (nom === nombre) return id
  }
  return null
}

export async function persistirFechaAdmin(
  fecha: FechaTorneoAdmin,
  fechaAnterior?: FechaTorneoAdmin,
): Promise<void> {
  const torneo = await obtenerTorneoActivo()
  if (!torneo) {
    throw new Error('No hay torneo activo configurado.')
  }

  const idsEnFormulario = new Set(
    fecha.partidos.filter((partido) => partido.id > 0).map((partido) => partido.id),
  )

  if (fechaAnterior) {
    for (const partido of fechaAnterior.partidos) {
      if (partido.id > 0 && !idsEnFormulario.has(partido.id)) {
        await eliminarPartido(partido.id)
      }
    }
  }

  const indiceDestacado = fecha.partidos.findIndex((p) => p.destacado_portada)
  const partidosParaGuardar = fecha.partidos.map((partido, indice) => ({
    ...partido,
    destacado_portada: indiceDestacado >= 0 ? indice === indiceDestacado : indice === 0,
  }))

  const ordenGuardado = [...partidosParaGuardar]
  const destacadoIdx = ordenGuardado.findIndex((p) => p.destacado_portada)
  if (destacadoIdx >= 0) {
    const [destacado] = ordenGuardado.splice(destacadoIdx, 1)
    ordenGuardado.push(destacado)
  }

  for (const partido of ordenGuardado) {
    const localId = nombreAIdEquipo(partido.local) ?? partido.equipo_local_id
    const visitanteId = nombreAIdEquipo(partido.visitante) ?? partido.equipo_visitante_id

    const cuerpo = {
      torneo_id: torneo.id,
      numero_fecha: fecha.numero,
      numero_partido: partido.numero_partido,
      equipo_local_id: localId,
      equipo_visitante_id: visitanteId,
      goles_local: partido.goles_local,
      goles_visitante: partido.goles_visitante,
      fecha_hora: fechaHoraUiAIso(partido.fecha_hora),
      cancha: canchaDePartido(partido.cancha),
      estado: estadoPartidoUiAApi(partido.estado),
      destacado_portada: partido.destacado_portada,
    }

    if (partido.id > 0) {
      await actualizarPartido(partido.id, cuerpo)
    } else {
      await crearPartido(cuerpo)
    }
  }

  await cargarPartidosAdmin()
}

export async function eliminarFechaAdmin(numeroFecha: number): Promise<void> {
  const fecha = fechasPartidosAdmin.value.find((f) => f.numero === numeroFecha)
  if (!fecha) return
  for (const partido of fecha.partidos) {
    if (partido.id > 0) await eliminarPartido(partido.id)
  }
  await cargarPartidosAdmin()
}

export async function eliminarPartidoAdmin(partidoId: number): Promise<void> {
  if (partidoId > 0) await eliminarPartido(partidoId)
  await cargarPartidosAdmin()
}

export async function persistirResultadoPartido(
  partido: PartidoAdmin,
  golesLocal: number,
  golesVisitante: number,
): Promise<void> {
  await actualizarPartido(partido.id, {
    goles_local: golesLocal,
    goles_visitante: golesVisitante,
    estado: 'Jugado',
  })
  await cargarPartidosAdmin()
}

export async function limpiarResultadoPartido(partido: PartidoAdmin): Promise<void> {
  await actualizarPartido(partido.id, {
    goles_local: null,
    goles_visitante: null,
    estado: 'Pendiente',
  })
  await cargarPartidosAdmin()
}

export async function actualizarEstadoPartidoEnApi(
  partido: PartidoAdmin,
  estado: EstadoPartido,
): Promise<void> {
  const cuerpo: { estado: ReturnType<typeof estadoPartidoUiAApi>; goles_local?: null; goles_visitante?: null } =
    { estado: estadoPartidoUiAApi(estado) }
  if (estado === 'PROGRAMADO') {
    cuerpo.goles_local = null
    cuerpo.goles_visitante = null
  }
  await actualizarPartido(partido.id, cuerpo)
  await cargarPartidosAdmin()
}

function partidoFinalizado(partido: PartidoAdmin): boolean {
  return (
    partido.estado === 'FINALIZADO' &&
    partido.goles_local !== null &&
    partido.goles_visitante !== null
  )
}

export function usarNotificacionesPartidos() {
  const panelAbierto = ref(false)

  const partidosFinalizados = computed<NotificacionPartidoFinalizado[]>(() => {
    const items: NotificacionPartidoFinalizado[] = []

    for (const fecha of fechasPartidosAdmin.value) {
      for (const partido of fecha.partidos) {
        if (!partidoFinalizado(partido)) continue
        items.push({
          idPartido: partido.id,
          numeroFecha: fecha.numero,
          local: partido.local,
          visitante: partido.visitante,
          golesLocal: partido.goles_local as number,
          golesVisitante: partido.goles_visitante as number,
          fechaHora: partido.fecha_hora,
        })
      }
    }

    return items.sort(
      (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
    )
  })

  const cantidadNoLeidas = computed(
    () =>
      partidosFinalizados.value.filter((p) => !idsNotificacionesLeidas.value.has(p.idPartido))
        .length,
  )

  function marcarTodasComoLeidas() {
    const siguiente = new Set(idsNotificacionesLeidas.value)
    for (const partido of partidosFinalizados.value) {
      siguiente.add(partido.idPartido)
    }
    idsNotificacionesLeidas.value = siguiente
    guardarIdsLeidos(siguiente)
  }

  function alternarPanel() {
    panelAbierto.value = !panelAbierto.value
    if (panelAbierto.value) {
      marcarTodasComoLeidas()
    }
  }

  function cerrarPanel() {
    panelAbierto.value = false
  }

  function formatearFechaPartido(fechaHora: string) {
    const fecha = new Date(fechaHora)
    if (Number.isNaN(fecha.getTime())) return fechaHora
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(fecha)
  }

  watch(partidosFinalizados, () => {
    // Mantiene ids leídos cuando cambian los partidos desde API.
  })

  return {
    panelAbierto,
    partidosFinalizados,
    cantidadNoLeidas,
    alternarPanel,
    cerrarPanel,
    formatearFechaPartido,
  }
}
