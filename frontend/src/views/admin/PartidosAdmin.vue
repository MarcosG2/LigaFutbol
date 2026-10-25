<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import AvisoDialog from '../../components/AvisoDialog.vue'
import { listarEquipos } from '../../api/equiposApi'
import { obtenerTorneoActivo } from '../../api/torneosApi'
import {
  cargarPartidosAdmin,
  eliminarFechaAdmin,
  eliminarPartidoAdmin,
  fechasPartidosAdmin,
  limpiarResultadoPartido,
  persistirFechaAdmin,
  persistirResultadoPartido,
  actualizarEstadoPartidoEnApi,
  type EstadoPartido,
  type FechaTorneoAdmin,
  type PartidoAdmin,
} from '../../composables/estadoPartidosAdmin'

type Partido = PartidoAdmin
type FechaTorneo = FechaTorneoAdmin

const canchasDisponibles = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha auxiliar']

const equipos = ref<{ id: number; nombre: string }[]>([])

const fechas = fechasPartidosAdmin

onMounted(async () => {
  try {
    const lista = await listarEquipos()
    equipos.value = lista.map((e) => ({ id: e.id, nombre: e.nombre }))
    await cargarPartidosAdmin()
  } catch {
    window.alert('No se pudieron cargar equipos o partidos desde el servidor.')
  }
})

const modalAbierto = ref(false)
const guardandoFecha = ref(false)
const anclaUltimoPartido = ref<HTMLElement | null>(null)
const destacadoPortadaInvalido = ref(false)
const avisoDialog = ref({
  abierto: false,
  titulo: 'Revisá el formulario',
  mensaje: '',
})

function mostrarAviso(mensaje: string, titulo = 'Revisá el formulario') {
  avisoDialog.value = { abierto: true, titulo, mensaje }
}

function cerrarAviso() {
  avisoDialog.value.abierto = false
}

const fechasExpandidas = ref<Record<number, boolean>>({ 1: true })

const fechaEnEdicion = ref<FechaTorneo>({
  id_fecha: 0,
  numero: 1,
  partidos: [],
})

const modalResultadoAbierto = ref(false)
const contextoResultado = ref<{ id_fecha: number; id_partido: number } | null>(null)
const golesLocalEdicion = ref<number | ''>('')
const golesVisitanteEdicion = ref<number | ''>('')
const fechaAnteriorAlEditar = ref<FechaTorneo | null>(null)

const fechasOrdenadas = computed(() =>
  [...fechas.value].sort((a, b) => a.numero - b.numero),
)

const tituloModal = computed(() =>
  fechaEnEdicion.value.id_fecha ? `Editar Fecha ${fechaEnEdicion.value.numero}` : 'Nueva fecha',
)

function fechaVacia(): FechaTorneo {
  const siguienteNumero =
    fechas.value.length === 0
      ? 1
      : Math.max(...fechas.value.map((f) => f.numero)) + 1

  return {
    id_fecha: 0,
    numero: siguienteNumero,
    partidos: [partidoVacio()],
  }
}

function numerosPartidoOcupadosEnEdicion(excluirIndice?: number): number[] {
  const numeros: number[] = []
  const fechaNumero = fechaEnEdicion.value.numero

  const fechaGuardada = fechas.value.find((f) => f.numero === fechaNumero)
  if (fechaGuardada) {
    for (const partido of fechaGuardada.partidos) {
      if (partido.numero_partido !== null) numeros.push(partido.numero_partido)
    }
  }

  fechaEnEdicion.value.partidos.forEach((partido, indice) => {
    if (excluirIndice !== undefined && indice === excluirIndice) return
    if (partido.numero_partido !== null && partido.numero_partido > 0) {
      numeros.push(partido.numero_partido)
    }
  })

  return numeros
}

function siguienteNumeroPartidoSugerido(): number {
  const ocupados = numerosPartidoOcupadosEnEdicion()
  if (ocupados.length === 0) return 1
  return Math.max(...ocupados) + 1
}

function partidoVacio(): Partido {
  const esPrimerPartido = fechaEnEdicion.value.partidos.length === 0
  return {
    id: 0,
    numero_partido: siguienteNumeroPartidoSugerido(),
    local: '',
    visitante: '',
    equipo_local_id: 0,
    equipo_visitante_id: 0,
    fecha_hora: '',
    cancha: 'Cancha 1',
    estado: 'PROGRAMADO',
    goles_local: null,
    goles_visitante: null,
    destacado_portada: esPrimerPartido,
  }
}

function marcarDestacadoPortada(indice: number) {
  fechaEnEdicion.value.partidos.forEach((partido, i) => {
    partido.destacado_portada = i === indice
  })
}

const indiceDestacadoPortadaEdicion = computed({
  get(): number {
    const indice = fechaEnEdicion.value.partidos.findIndex((p) => p.destacado_portada)
    return indice >= 0 ? indice : 0
  },
  set(indice: number) {
    marcarDestacadoPortada(indice)
    destacadoPortadaInvalido.value = false
  },
})

function asegurarDestacadoUnico() {
  const partidos = fechaEnEdicion.value.partidos
  if (partidos.length === 0) return
  const cantidad = partidos.filter((p) => p.destacado_portada).length
  if (cantidad !== 1) {
    marcarDestacadoPortada(0)
  }
}

function obtenerFechaPartido(partido: Partido): string {
  if (!partido.fecha_hora) return ''
  return partido.fecha_hora.slice(0, 10)
}

function obtenerHoraPartido(partido: Partido): string {
  if (!partido.fecha_hora) return ''
  const hora = partido.fecha_hora.slice(11, 16)
  return hora.length === 5 ? hora : ''
}

function actualizarFechaPartido(partido: Partido, fecha: string) {
  const hora = obtenerHoraPartido(partido) || '12:00'
  partido.fecha_hora = fecha ? `${fecha}T${hora}` : ''
}

function actualizarHoraPartido(partido: Partido, hora: string) {
  const fecha =
    obtenerFechaPartido(partido) || new Date().toISOString().slice(0, 10)
  partido.fecha_hora = hora ? `${fecha}T${hora}` : partido.fecha_hora
}

function textoResultado(partido: Partido): string {
  if (partido.goles_local === null || partido.goles_visitante === null) {
    return '—'
  }
  return `${partido.goles_local} - ${partido.goles_visitante}`
}

function tieneResultado(partido: Partido): boolean {
  return partido.goles_local !== null && partido.goles_visitante !== null
}

function buscarPartido(idFecha: number, idPartido: number): Partido | undefined {
  const fecha = fechas.value.find((f) => f.id_fecha === idFecha)
  return fecha?.partidos.find((p) => p.id === idPartido)
}

async function alCambiarEstadoPartido(partido: Partido) {
  if (partido.id <= 0) {
    if (partido.estado === 'PROGRAMADO') {
      partido.goles_local = null
      partido.goles_visitante = null
    }
    return
  }
  try {
    await actualizarEstadoPartidoEnApi(partido, partido.estado)
  } catch {
    window.alert('No se pudo actualizar el estado del partido.')
  }
}

function abrirCargarResultado(idFecha: number, idPartido: number) {
  const partido = buscarPartido(idFecha, idPartido)
  if (!partido) return

  contextoResultado.value = { id_fecha: idFecha, id_partido: idPartido }
  golesLocalEdicion.value = partido.goles_local ?? ''
  golesVisitanteEdicion.value = partido.goles_visitante ?? ''
  modalResultadoAbierto.value = true
}

function cerrarModalResultado() {
  modalResultadoAbierto.value = false
  contextoResultado.value = null
  golesLocalEdicion.value = ''
  golesVisitanteEdicion.value = ''
}

async function guardarResultado() {
  if (!contextoResultado.value) return

  const partido = buscarPartido(
    contextoResultado.value.id_fecha,
    contextoResultado.value.id_partido,
  )
  if (!partido) return

  const local = golesLocalEdicion.value
  const visitante = golesVisitanteEdicion.value

  if (local === '' || visitante === '' || local < 0 || visitante < 0) {
    window.alert('Ingresá goles válidos (0 o más) para local y visitante.')
    return
  }

  try {
    await persistirResultadoPartido(partido, local, visitante)
    cerrarModalResultado()
  } catch {
    window.alert('No se pudo guardar el resultado.')
  }
}

async function limpiarResultado(idFecha: number, idPartido: number) {
  const partido = buscarPartido(idFecha, idPartido)
  if (!partido || !tieneResultado(partido)) return

  const confirmar = window.confirm('¿Quitar el resultado y dejar el partido como PROGRAMADO?')
  if (!confirmar) return

  try {
    await limpiarResultadoPartido(partido)
  } catch {
    window.alert('No se pudo limpiar el resultado.')
  }
}

function abrirNuevaFecha() {
  fechaAnteriorAlEditar.value = null
  fechaEnEdicion.value = fechaVacia()
  asegurarDestacadoUnico()
  destacadoPortadaInvalido.value = false
  modalAbierto.value = true
}

function abrirEditarFecha(fecha: FechaTorneo) {
  fechaAnteriorAlEditar.value = {
    id_fecha: fecha.id_fecha,
    numero: fecha.numero,
    partidos: fecha.partidos.map((p) => ({ ...p })),
  }
  fechaEnEdicion.value = {
    id_fecha: fecha.id_fecha,
    numero: fecha.numero,
    partidos: fecha.partidos.map((p, indice) => ({
      ...p,
      numero_partido: p.numero_partido ?? indice + 1,
    })),
  }
  if (fechaEnEdicion.value.partidos.length === 0) {
    fechaEnEdicion.value.partidos.push(partidoVacio())
  }
  asegurarDestacadoUnico()
  destacadoPortadaInvalido.value = false
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
  fechaAnteriorAlEditar.value = null
  fechaEnEdicion.value = fechaVacia()
  destacadoPortadaInvalido.value = false
  cerrarAviso()
}

async function agregarPartidoEnFormulario() {
  fechaEnEdicion.value.partidos.push(partidoVacio())
  asegurarDestacadoUnico()
  await nextTick()
  anclaUltimoPartido.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function asignarRefUltimoPartido(el: Element | null, indice: number) {
  if (indice === fechaEnEdicion.value.partidos.length - 1) {
    anclaUltimoPartido.value = el as HTMLElement | null
  }
}

function quitarPartidoEnFormulario(indice: number) {
  const eraDestacado = fechaEnEdicion.value.partidos[indice]?.destacado_portada
  fechaEnEdicion.value.partidos.splice(indice, 1)
  if (eraDestacado && fechaEnEdicion.value.partidos.length > 0) {
    fechaEnEdicion.value.partidos[0].destacado_portada = true
  }
}

function toggleFecha(idFecha: number) {
  fechasExpandidas.value[idFecha] = !fechasExpandidas.value[idFecha]
}

function estaExpandida(idFecha: number): boolean {
  return fechasExpandidas.value[idFecha] ?? false
}

function formatearFechaHora(valor: string): string {
  if (!valor) return '—'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)
}

function clasesEstado(estado: EstadoPartido): string {
  if (estado === 'FINALIZADO') {
    return 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30'
  }
  if (estado === 'EN_JUEGO') {
    return 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
  }
  return 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30'
}

function etiquetaPartido(partido: Partido, indice: number): string {
  return partido.numero_partido ? `Partido ${partido.numero_partido}` : `Partido ${indice + 1}`
}

function validarPartido(partido: Partido, indice: number): string | null {
  const etiqueta = etiquetaPartido(partido, indice)

  if (!partido.numero_partido || partido.numero_partido < 1) {
    return `${etiqueta}: indicá el número de partido en la fecha (1 o más).`
  }

  const duplicadoEnFormulario = fechaEnEdicion.value.partidos.some(
    (otro, otroIndice) =>
      otroIndice !== indice &&
      otro.numero_partido === partido.numero_partido,
  )
  if (duplicadoEnFormulario) {
    return `${etiqueta}: ya hay otro cruce con el número ${partido.numero_partido} en esta fecha.`
  }

  const fechaNumero = fechaEnEdicion.value.numero
  const fechaGuardada = fechas.value.find((f) => f.numero === fechaNumero)
  if (fechaGuardada) {
    const duplicadoEnServidor = fechaGuardada.partidos.some(
      (existente) =>
        existente.numero_partido === partido.numero_partido && existente.id !== partido.id,
    )
    if (duplicadoEnServidor) {
      return `${etiqueta}: el partido ${partido.numero_partido} ya existe en la Fecha ${fechaNumero}.`
    }
  }

  if (!partido.local || !partido.visitante) {
    return `${etiqueta}: elegí local y visitante.`
  }
  if (partido.local === partido.visitante) {
    return `${etiqueta}: local y visitante no pueden ser el mismo equipo.`
  }
  if (!partido.fecha_hora) {
    return `${etiqueta}: indicá fecha y hora.`
  }
  if (!partido.cancha.trim()) {
    return `${etiqueta}: indicá la cancha.`
  }
  if (partido.estado === 'FINALIZADO' && !tieneResultado(partido)) {
    return `${etiqueta}: un partido FINALIZADO debe tener resultado cargado.`
  }
  if (partido.goles_local !== null && partido.goles_local < 0) {
    return `${etiqueta}: goles del local inválidos.`
  }
  if (partido.goles_visitante !== null && partido.goles_visitante < 0) {
    return `${etiqueta}: goles del visitante inválidos.`
  }
  return null
}

async function guardarFecha() {
  const numero = fechaEnEdicion.value.numero
  if (!numero || numero < 1) {
    mostrarAviso('El número de fecha debe ser mayor a 0.')
    return
  }

  const numeroDuplicado = fechas.value.some(
    (f) => f.numero === numero && f.id_fecha !== fechaEnEdicion.value.id_fecha,
  )
  if (numeroDuplicado) {
    mostrarAviso(`Ya existe la Fecha ${numero}.`)
    return
  }

  if (fechaEnEdicion.value.partidos.length === 0) {
    mostrarAviso('Agregá al menos un partido a la fecha.')
    return
  }

  for (let i = 0; i < fechaEnEdicion.value.partidos.length; i++) {
    const error = validarPartido(fechaEnEdicion.value.partidos[i], i)
    if (error) {
      mostrarAviso(error)
      return
    }
  }

  asegurarDestacadoUnico()
  const cantidadDestacados = fechaEnEdicion.value.partidos.filter((p) => p.destacado_portada).length
  if (cantidadDestacados !== 1) {
    destacadoPortadaInvalido.value = true
    mostrarAviso(
      'Elegí exactamente un partido con la opción «Destacado en portada» (el círculo junto a cada cruce). Ese partido se muestra en la portada del sitio.',
      'Partido destacado',
    )
    return
  }
  destacadoPortadaInvalido.value = false

  const payload: FechaTorneo = {
    id_fecha: numero,
    numero,
    partidos: fechaEnEdicion.value.partidos.map((partido) => ({ ...partido })),
  }

  guardandoFecha.value = true
  try {
    const torneo = await obtenerTorneoActivo()
    if (!torneo) {
      mostrarAviso(
        'No hay torneo activo. Andá a Admin → Torneo, creá uno y dejalo en estado Activo.',
        'Torneo requerido',
      )
      return
    }

    await persistirFechaAdmin(payload, fechaAnteriorAlEditar.value ?? undefined)
    fechasExpandidas.value[numero] = true
    cerrarModal()
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : 'No se pudo guardar la fecha en el servidor.'
    mostrarAviso(mensaje, 'Error al guardar')
  } finally {
    guardandoFecha.value = false
  }
}

async function eliminarFecha(idFecha: number) {
  const fecha = fechas.value.find((f) => f.id_fecha === idFecha)
  if (!fecha) return

  const confirmar = window.confirm(`¿Eliminar la Fecha ${fecha.numero} y todos sus partidos?`)
  if (!confirmar) return

  try {
    await eliminarFechaAdmin(fecha.numero)
    delete fechasExpandidas.value[idFecha]
  } catch {
    window.alert('No se pudo eliminar la fecha.')
  }
}

async function eliminarPartidoDeFecha(idFecha: number, idPartido: number) {
  const fecha = fechas.value.find((f) => f.id_fecha === idFecha)
  if (!fecha) return

  const partido = fecha.partidos.find((p) => p.id === idPartido)
  if (!partido) return

  const confirmar = window.confirm(
    `¿Eliminar el partido ${partido.local} vs ${partido.visitante}?`,
  )
  if (!confirmar) return

  try {
    await eliminarPartidoAdmin(idPartido)
  } catch {
    window.alert('No se pudo eliminar el partido.')
  }
}
</script>

<template>
  <div class="mx-auto max-w-[90rem] space-y-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Gestión del <span class="text-yellow-400">fixture</span>
        </h2>
        <p class="mt-2 text-sm text-zinc-400 sm:text-base">
          Fechas, cruces, horarios y canchas (sincronizado con la API).
        </p>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-2.5 text-sm font-extrabold tracking-wide text-black uppercase shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105"
        @click="abrirNuevaFecha"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="h-4 w-4"
          aria-hidden="true"
        >
          <path stroke-linecap="round" d="M12 5v14M5 12h14" />
        </svg>
        Nueva Fecha
      </button>
    </header>

    <section v-if="fechasOrdenadas.length === 0" class="rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-6 py-16 text-center">
      <p class="text-zinc-400">Todavía no hay fechas cargadas.</p>
      <button
        type="button"
        class="mt-4 text-sm font-medium text-yellow-400 hover:text-yellow-300"
        @click="abrirNuevaFecha"
      >
        Crear la primera fecha →
      </button>
    </section>

    <div v-else class="space-y-4">
      <article
        v-for="fecha in fechasOrdenadas"
        :key="fecha.id_fecha"
        class="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm"
      >
        <header
          class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-5 py-4"
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            @click="toggleFecha(fecha.id_fecha)"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15 text-sm font-bold text-yellow-400 ring-1 ring-yellow-500/25"
            >
              {{ fecha.numero }}
            </span>
            <div class="min-w-0">
              <h3 class="text-base font-semibold text-white">Fecha {{ fecha.numero }}</h3>
              <p class="text-xs text-zinc-500">
                {{ fecha.partidos.length }} partido(s)
                <span class="mx-1">·</span>
                {{ estaExpandida(fecha.id_fecha) ? 'Ocultar' : 'Ver cruces' }}
              </p>
            </div>
            <span class="ml-auto text-zinc-500" aria-hidden="true">
              {{ estaExpandida(fecha.id_fecha) ? '▾' : '▸' }}
            </span>
          </button>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-zinc-700/80 px-2.5 py-1.5 text-xs font-medium text-yellow-400/90 transition-colors hover:border-yellow-500/40 hover:bg-yellow-500/10"
              @click.stop="abrirEditarFecha(fecha)"
            >
              Editar fecha
            </button>
            <button
              type="button"
              class="rounded-lg border border-zinc-700/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
              @click.stop="eliminarFecha(fecha.id_fecha)"
            >
              Eliminar fecha
            </button>
          </div>
        </header>

        <div v-show="estaExpandida(fecha.id_fecha)" class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-sm">
            <thead>
              <tr
                class="border-b border-zinc-800/80 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase"
              >
                <th class="px-3 py-3 text-center">Nº</th>
                <th class="px-5 py-3">Local</th>
                <th class="px-3 py-3">Visitante</th>
                <th class="px-3 py-3">Fecha y hora</th>
                <th class="px-3 py-3">Cancha</th>
                <th class="px-3 py-3 text-center">Resultado</th>
                <th class="px-3 py-3">Estado</th>
                <th class="px-3 py-3 text-center">Portada</th>
                <th class="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-if="fecha.partidos.length === 0"
                class="border-b border-zinc-800/60"
              >
                <td colspan="9" class="px-5 py-10 text-center text-zinc-500">
                  Sin partidos en esta fecha.
                </td>
              </tr>
              <tr
                v-for="partido in fecha.partidos"
                :key="partido.id"
                class="border-b border-zinc-800/60 transition-colors last:border-b-0 hover:bg-zinc-800/30"
              >
                <td class="px-3 py-3.5 text-center tabular-nums text-zinc-400">
                  {{ partido.numero_partido ?? '—' }}
                </td>
                <td class="px-5 py-3.5 font-medium text-white">{{ partido.local }}</td>
                <td class="px-3 py-3.5 text-zinc-300">{{ partido.visitante }}</td>
                <td class="px-3 py-3.5 whitespace-nowrap text-zinc-400 tabular-nums">
                  {{ formatearFechaHora(partido.fecha_hora) }}
                </td>
                <td class="px-3 py-3.5 text-zinc-300">{{ partido.cancha }}</td>
                <td class="px-3 py-3.5 text-center">
                  <span
                    class="font-bold tabular-nums"
                    :class="tieneResultado(partido) ? 'text-yellow-400' : 'text-zinc-600'"
                  >
                    {{ textoResultado(partido) }}
                  </span>
                </td>
                <td class="px-3 py-3.5">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase"
                    :class="clasesEstado(partido.estado)"
                  >
                    {{ partido.estado }}
                  </span>
                </td>
                <td class="px-3 py-3.5 text-center">
                  <span
                    v-if="partido.destacado_portada"
                    class="inline-flex rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-yellow-400 ring-1 ring-yellow-500/30"
                    title="Aparece en la portada del sitio"
                  >
                    ★ Portada
                  </span>
                  <span v-else class="text-zinc-600">—</span>
                </td>
                <td class="px-5 py-3.5 text-right">
                  <div class="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      class="text-xs font-medium text-yellow-400/90 transition-colors hover:text-yellow-300"
                      @click="abrirCargarResultado(fecha.id_fecha, partido.id)"
                    >
                      {{ tieneResultado(partido) ? 'Editar resultado' : 'Cargar resultado' }}
                    </button>
                    <button
                      v-if="tieneResultado(partido)"
                      type="button"
                      class="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                      @click="limpiarResultado(fecha.id_fecha, partido.id)"
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      class="text-xs text-zinc-400 transition-colors hover:text-red-400"
                      @click="eliminarPartidoDeFecha(fecha.id_fecha, partido.id)"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>

    <Teleport to="body">
      <div
        v-if="modalAbierto"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-fecha"
      >
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          aria-hidden="true"
          @click="cerrarModal"
        />

        <form
          novalidate
          lang="es-AR"
          class="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
          @submit.prevent="guardarFecha"
        >
          <header
            class="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800/80 px-6 py-4"
          >
            <div>
              <h3 id="titulo-modal-fecha" class="text-lg font-semibold text-white">
                {{ tituloModal }}
              </h3>
              <p class="mt-1 text-sm text-zinc-400">
                Definí el número de jornada, los cruces y cuál es el partido destacado en la portada.
              </p>
            </div>
            <button
              type="button"
              class="rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Cerrar"
              :disabled="guardandoFecha"
              @click="cerrarModal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-5 w-5"
              >
                <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div
            class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 pb-6 sm:px-6 sm:pb-8"
          >
            <div class="max-w-xs">
              <label for="numero-fecha" class="mb-1.5 block text-sm font-medium text-zinc-300">
                Número de fecha
              </label>
              <input
                id="numero-fecha"
                v-model.number="fechaEnEdicion.numero"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-white tabular-nums focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              />
            </div>

            <div
              class="space-y-3 rounded-lg transition-shadow"
              :class="
                destacadoPortadaInvalido
                  ? 'ring-2 ring-amber-500/60 ring-offset-2 ring-offset-zinc-900'
                  : ''
              "
            >
              <p
                v-if="destacadoPortadaInvalido"
                class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
              >
                Marcá un solo cruce como <strong>Destacado en portada</strong>.
              </p>
              <h4 class="text-sm font-semibold tracking-wide text-yellow-400 uppercase">
                Partidos de la fecha
              </h4>

              <div
                v-for="(partido, indice) in fechaEnEdicion.partidos"
                :key="`partido-form-${indice}`"
                :ref="(el) => asignarRefUltimoPartido(el as Element | null, indice)"
                class="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 sm:p-5"
              >
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-medium text-zinc-500 uppercase">Cruce</span>
                    <div class="flex items-center gap-2">
                      <label
                        :for="`numero-partido-${indice}`"
                        class="text-xs text-zinc-400"
                      >
                        Nº en la fecha
                      </label>
                      <input
                        :id="`numero-partido-${indice}`"
                        v-model.number="partido.numero_partido"
                        type="number"
                        min="1"
                        required
                        class="w-16 rounded-lg border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-center text-sm text-white tabular-nums focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      />
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-3">
                    <label
                      class="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300"
                      :for="`destacado-portada-${indice}`"
                    >
                      <input
                        :id="`destacado-portada-${indice}`"
                        v-model="indiceDestacadoPortadaEdicion"
                        type="radio"
                        name="destacado-portada-fecha"
                        class="h-3.5 w-3.5 border-zinc-600 text-yellow-500 focus:ring-yellow-500/30"
                        :value="indice"
                      />
                      Destacado en portada
                    </label>
                    <button
                      v-if="fechaEnEdicion.partidos.length > 1"
                      type="button"
                      class="text-xs text-zinc-400 hover:text-red-400"
                      @click="quitarPartidoEnFormulario(indice)"
                    >
                      Quitar fila
                    </button>
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label class="mb-1 block text-xs text-zinc-400">Equipo local</label>
                    <select
                      v-model="partido.local"
                      required
                      class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    >
                      <option disabled value="">Seleccionar...</option>
                      <option
                        v-for="equipo in equipos"
                        :key="`local-${equipo.id}-${indice}`"
                        :value="equipo.nombre"
                      >
                        {{ equipo.nombre }}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="mb-1 block text-xs text-zinc-400">Equipo visitante</label>
                    <select
                      v-model="partido.visitante"
                      required
                      class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    >
                      <option disabled value="">Seleccionar...</option>
                      <option
                        v-for="equipo in equipos"
                        :key="`visit-${equipo.id}-${indice}`"
                        :value="equipo.nombre"
                        :disabled="equipo.nombre === partido.local"
                      >
                        {{ equipo.nombre }}
                      </option>
                    </select>
                  </div>

                  <div class="sm:col-span-2 lg:col-span-1">
                    <span class="mb-1 block text-xs text-zinc-400">Fecha y hora</span>
                    <div class="grid grid-cols-2 gap-2">
                      <input
                        :id="`fecha-partido-${indice}`"
                        type="date"
                        lang="es-AR"
                        required
                        class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                        :value="obtenerFechaPartido(partido)"
                        @input="
                          actualizarFechaPartido(
                            partido,
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                      />
                      <input
                        :id="`hora-partido-${indice}`"
                        type="time"
                        lang="es-AR"
                        required
                        step="60"
                        class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                        :value="obtenerHoraPartido(partido)"
                        @input="
                          actualizarHoraPartido(
                            partido,
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                      />
                    </div>
                  </div>

                  <div>
                    <label class="mb-1 block text-xs text-zinc-400">Cancha</label>
                    <select
                      v-model="partido.cancha"
                      class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    >
                      <option v-for="cancha in canchasDisponibles" :key="cancha" :value="cancha">
                        {{ cancha }}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="mb-1 block text-xs text-zinc-400">Estado</label>
                    <select
                      v-model="partido.estado"
                      class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      @change="alCambiarEstadoPartido(partido)"
                    >
                      <option value="PROGRAMADO">PROGRAMADO</option>
                      <option value="EN_JUEGO">EN_JUEGO</option>
                      <option value="FINALIZADO">FINALIZADO</option>
                    </select>
                  </div>

                  <div>
                    <label class="mb-1 block text-xs text-zinc-400">Goles local</label>
                    <input
                      v-model.number="partido.goles_local"
                      type="number"
                      min="0"
                      class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white tabular-nums focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      placeholder="—"
                    />
                  </div>

                  <div>
                    <label class="mb-1 block text-xs text-zinc-400">Goles visitante</label>
                    <input
                      v-model.number="partido.goles_visitante"
                      type="number"
                      min="0"
                      class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white tabular-nums focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      placeholder="—"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-600/80 bg-zinc-950/30 px-4 py-3.5 text-sm font-semibold text-yellow-400 transition-colors hover:border-yellow-500/50 hover:bg-yellow-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="guardandoFecha"
                @click="agregarPartidoEnFormulario"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="h-4 w-4 shrink-0"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" d="M12 5v14M5 12h14" />
                </svg>
                Agregar partido
              </button>
            </div>
          </div>

          <footer
            class="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-800/80 bg-zinc-900/85 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-900/75 sm:gap-3 sm:px-6 sm:py-4"
          >
            <button
              type="button"
              class="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              :disabled="guardandoFecha"
              @click="cerrarModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              :disabled="guardandoFecha"
            >
              <svg
                v-if="guardandoFecha"
                class="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {{ guardandoFecha ? 'Guardando…' : 'Guardar fecha' }}
            </button>
          </footer>
        </form>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="modalResultadoAbierto"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-resultado"
      >
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          aria-hidden="true"
          @click="cerrarModalResultado"
        />

        <form
          class="relative z-10 w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
          @submit.prevent="guardarResultado"
        >
          <h3 id="titulo-modal-resultado" class="text-lg font-semibold text-white">
            Cargar resultado
          </h3>
          <p
            v-if="contextoResultado && buscarPartido(contextoResultado.id_fecha, contextoResultado.id_partido)"
            class="mt-1 text-sm text-zinc-400"
          >
            {{
              buscarPartido(contextoResultado.id_fecha, contextoResultado.id_partido)?.local
            }}
            vs
            {{
              buscarPartido(contextoResultado.id_fecha, contextoResultado.id_partido)?.visitante
            }}
          </p>

          <div class="mt-5 flex items-end justify-center gap-3">
            <div class="w-20 text-center">
              <label class="mb-1 block text-[10px] font-medium text-zinc-500 uppercase">
                Local
              </label>
              <input
                v-model.number="golesLocalEdicion"
                type="number"
                min="0"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-2 py-2.5 text-center text-lg font-bold text-white tabular-nums focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              />
            </div>
            <span class="pb-2 text-xl font-bold text-yellow-400">-</span>
            <div class="w-20 text-center">
              <label class="mb-1 block text-[10px] font-medium text-zinc-500 uppercase">
                Visit.
              </label>
              <input
                v-model.number="golesVisitanteEdicion"
                type="number"
                min="0"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-2 py-2.5 text-center text-lg font-bold text-white tabular-nums focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              />
            </div>
          </div>

          <p class="mt-3 text-center text-xs text-zinc-500">
            Al guardar, el partido pasa a estado FINALIZADO.
          </p>

          <footer class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              @click="cerrarModalResultado"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-2 text-sm font-bold text-black shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105"
            >
              Guardar resultado
            </button>
          </footer>
        </form>
      </div>
    </Teleport>

    <AvisoDialog
      :abierto="avisoDialog.abierto"
      :titulo="avisoDialog.titulo"
      :mensaje="avisoDialog.mensaje"
      @cerrar="cerrarAviso"
    />
  </div>
</template>
