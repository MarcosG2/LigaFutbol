<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as XLSX from 'xlsx'
import {
  actualizarEquipo,
  crearEquipo,
  eliminarEquipo,
  listarEquipos,
  subirEscudoEquipo,
} from '../../api/equiposApi'
import {
  crearJugador,
  eliminarJugador,
  listarJugadores,
} from '../../api/jugadoresApi'
import type { JugadorApi } from '../../api/tipos'
import { optimizarImagenEscudo } from '../../utils/optimizarImagenEscudo'

const MIN_JUGADORES = 11
const MAX_JUGADORES = 28

type Jugador = {
  nombre: string
  dorsal: number
}

type Equipo = {
  id: number
  nombre: string
  escudoUrl: string | null
  jugadores: Jugador[]
}

type JugadorPersistido = Jugador & { id?: number }

const TAMANO_MAX_ESCUDO_MB = 2
const TIPOS_ESCUDO_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

const equipos = ref<Equipo[]>([])
const jugadoresPorEquipo = ref<Map<number, JugadorApi[]>>(new Map())
const cargando = ref(false)

const busqueda = ref('')
const modalAbierto = ref(false)
const inputArchivoExcel = ref<HTMLInputElement | null>(null)
const inputArchivoEscudo = ref<HTMLInputElement | null>(null)
const escudoArchivoPendiente = ref<File | null>(null)
const escudoMarcadoParaEliminar = ref(false)

const nombreJugadorNuevo = ref('')
const dorsalJugadorNuevo = ref<number | ''>('')

const equipoActual = ref<Equipo>({
  id: 0,
  nombre: '',
  escudoUrl: null,
  jugadores: [],
})

const equiposFiltrados = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()
  if (!termino) return equipos.value

  return equipos.value.filter((equipo) => equipo.nombre.toLowerCase().includes(termino))
})

const tituloModal = computed(() =>
  equipoActual.value.id ? 'Editar equipo' : 'Nuevo equipo',
)

const cantidadPlantillaActual = computed(() => equipoActual.value.jugadores.length)

const plantillaValida = computed(
  () =>
    cantidadPlantillaActual.value >= MIN_JUGADORES &&
    cantidadPlantillaActual.value <= MAX_JUGADORES,
)

const textoValidacionPlantilla = computed(() => {
  const cantidad = cantidadPlantillaActual.value
  if (cantidad < MIN_JUGADORES) {
    return `Mínimo ${MIN_JUGADORES} - Máximo ${MAX_JUGADORES} jugadores (faltan ${MIN_JUGADORES - cantidad})`
  }
  if (cantidad > MAX_JUGADORES) {
    return `Mínimo ${MIN_JUGADORES} - Máximo ${MAX_JUGADORES} jugadores (excedés por ${cantidad - MAX_JUGADORES})`
  }
  return `Mínimo ${MIN_JUGADORES} - Máximo ${MAX_JUGADORES} jugadores`
})

function equipoVacio(): Equipo {
  return { id: 0, nombre: '', escudoUrl: null, jugadores: [] }
}

function inicialesEquipo(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return 'EQ'
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return `${palabras[0][0]}${palabras[1][0]}`.toUpperCase()
}

function abrirSelectorEscudo() {
  inputArchivoEscudo.value?.click()
}

function quitarEscudo() {
  equipoActual.value.escudoUrl = null
  escudoArchivoPendiente.value = null
  escudoMarcadoParaEliminar.value = true
  if (inputArchivoEscudo.value) {
    inputArchivoEscudo.value.value = ''
  }
}

async function manejarEscudoSeleccionado(event: Event) {
  const input = event.target as HTMLInputElement
  const archivoOriginal = input.files?.[0]
  if (!archivoOriginal) return

  if (!TIPOS_ESCUDO_PERMITIDOS.includes(archivoOriginal.type)) {
    window.alert('Formato no válido. Usá JPG, PNG, WEBP o SVG.')
    input.value = ''
    return
  }

  const tamanoMb = archivoOriginal.size / (1024 * 1024)
  if (tamanoMb > TAMANO_MAX_ESCUDO_MB) {
    window.alert(`El escudo no puede superar ${TAMANO_MAX_ESCUDO_MB} MB.`)
    input.value = ''
    return
  }

  const archivo = await optimizarImagenEscudo(archivoOriginal)

  escudoArchivoPendiente.value = archivo
  escudoMarcadoParaEliminar.value = false

  const lector = new FileReader()
  lector.onload = () => {
    if (typeof lector.result === 'string') {
      equipoActual.value.escudoUrl = lector.result
    }
  }
  lector.onerror = () => {
    window.alert('No se pudo leer la imagen del escudo.')
  }
  lector.readAsDataURL(archivo)
  input.value = ''
}

function textoCantidadJugadores(equipo: Equipo): string {
  return `${equipo.jugadores.length}/${MAX_JUGADORES}`
}

function clasesCantidadJugadores(cantidad: number): string {
  if (cantidad < MIN_JUGADORES) return 'text-amber-400'
  if (cantidad > MAX_JUGADORES) return 'text-red-400'
  return 'text-lime-400'
}

function abrirModalNuevo() {
  equipoActual.value = equipoVacio()
  escudoArchivoPendiente.value = null
  escudoMarcadoParaEliminar.value = false
  limpiarFormularioJugador()
  modalAbierto.value = true
}

function abrirModalEditar(equipo: Equipo) {
  equipoActual.value = {
    ...equipo,
    escudoUrl: equipo.escudoUrl ?? null,
    jugadores: equipo.jugadores.map((j) => ({ ...j })),
  }
  escudoArchivoPendiente.value = null
  escudoMarcadoParaEliminar.value = false
  limpiarFormularioJugador()
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
  equipoActual.value = equipoVacio()
  escudoArchivoPendiente.value = null
  escudoMarcadoParaEliminar.value = false
  limpiarFormularioJugador()
  if (inputArchivoEscudo.value) {
    inputArchivoEscudo.value.value = ''
  }
}

function limpiarFormularioJugador() {
  nombreJugadorNuevo.value = ''
  dorsalJugadorNuevo.value = ''
}

function agregarJugador() {
  const nombre = nombreJugadorNuevo.value.trim()
  const dorsal = dorsalJugadorNuevo.value

  if (!nombre || dorsal === '' || dorsal < 1) {
    window.alert('Ingresá nombre y dorsal válido (número mayor a 0).')
    return
  }

  if (equipoActual.value.jugadores.length >= MAX_JUGADORES) {
    window.alert(`La plantilla no puede superar ${MAX_JUGADORES} jugadores.`)
    return
  }

  const dorsalOcupado = equipoActual.value.jugadores.some((j) => j.dorsal === dorsal)
  if (dorsalOcupado) {
    window.alert(`El dorsal ${dorsal} ya está asignado en este equipo.`)
    return
  }

  equipoActual.value.jugadores.push({ nombre, dorsal })
  equipoActual.value.jugadores.sort((a, b) => a.dorsal - b.dorsal)
  limpiarFormularioJugador()
}

function quitarJugador(indice: number) {
  equipoActual.value.jugadores.splice(indice, 1)
}

function abrirSelectorExcel() {
  inputArchivoExcel.value?.click()
}

function mostrarAyudaFormatoExcel() {
  window.alert(
    `Formato del archivo (.xlsx, .xls o .csv):\n\n` +
      `• Columna A (izquierda): número de camiseta\n` +
      `• Columna B (derecha): nombre del jugador\n\n` +
      `Ejemplo:\n` +
      `10 | Juan Pérez\n` +
      `7  | María López\n\n` +
      `Si la primera fila tiene texto en la columna A (encabezados), se omite.\n` +
      `Máximo ${MAX_JUGADORES} jugadores por equipo.`,
  )
}

function esFilaEncabezado(numero: unknown, nombre: unknown): boolean {
  const textoNumero = String(numero ?? '').trim().toLowerCase()
  const textoNombre = String(nombre ?? '').trim().toLowerCase()
  if (!textoNumero && !textoNombre) return false

  const palabrasNumero = ['numero', 'número', 'nro', 'dorsal', 'camiseta', '#']
  const palabrasNombre = ['nombre', 'jugador', 'apellido', 'player']

  return (
    palabrasNumero.some((p) => textoNumero.includes(p)) ||
    palabrasNombre.some((p) => textoNombre.includes(p))
  )
}

function parsearCeldaDorsal(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const dorsal = typeof valor === 'number' ? valor : Number(String(valor).trim())
  if (!Number.isFinite(dorsal) || dorsal < 1 || !Number.isInteger(dorsal)) return null
  return dorsal
}

function parsearCeldaNombre(valor: unknown): string | null {
  const nombre = String(valor ?? '').trim()
  return nombre.length > 0 ? nombre : null
}

function extraerJugadoresDesdeFilas(filas: unknown[][]): Jugador[] {
  const jugadores: Jugador[] = []
  const dorsalesUsados = new Set<number>()

  for (let indice = 0; indice < filas.length; indice++) {
    const fila = filas[indice]
    if (!fila || fila.length < 2) continue

    const celdaNumero = fila[0]
    const celdaNombre = fila[1]

    if (indice === 0 && esFilaEncabezado(celdaNumero, celdaNombre)) continue

    const dorsal = parsearCeldaDorsal(celdaNumero)
    const nombre = parsearCeldaNombre(celdaNombre)

    if (dorsal === null && nombre === null) continue

    if (dorsal === null || nombre === null) {
      throw new Error(`Fila ${indice + 1}: cada jugador debe tener número y nombre.`)
    }

    if (dorsalesUsados.has(dorsal)) {
      throw new Error(`Fila ${indice + 1}: el dorsal ${dorsal} está repetido en el archivo.`)
    }

    dorsalesUsados.add(dorsal)
    jugadores.push({ dorsal, nombre })
  }

  return jugadores.sort((a, b) => a.dorsal - b.dorsal)
}

async function importarExcel(event: Event) {
  const input = event.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return

  try {
    const buffer = await archivo.arrayBuffer()
    const libro = XLSX.read(buffer, { type: 'array' })
    const nombreHoja = libro.SheetNames[0]
    if (!nombreHoja) {
      window.alert('El archivo no tiene hojas para leer.')
      return
    }

    const hoja = libro.Sheets[nombreHoja]
    const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
      header: 1,
      defval: '',
      raw: false,
    }) as unknown[][]

    const jugadoresImportados = extraerJugadoresDesdeFilas(filas)

    if (jugadoresImportados.length === 0) {
      window.alert('No se encontraron jugadores válidos. Revisá el formato del archivo.')
      return
    }

    if (jugadoresImportados.length > MAX_JUGADORES) {
      window.alert(
        `El archivo tiene ${jugadoresImportados.length} jugadores. El máximo permitido es ${MAX_JUGADORES}.`,
      )
      return
    }

    const reemplazar = equipoActual.value.jugadores.length > 0
      ? window.confirm(
          `Se importarán ${jugadoresImportados.length} jugador(es) y se reemplazará la plantilla actual. ¿Continuar?`,
        )
      : true

    if (!reemplazar) return

    equipoActual.value.jugadores = jugadoresImportados
    window.alert(`Plantilla actualizada: ${jugadoresImportados.length} jugador(es) importados.`)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'No se pudo leer el archivo.'
    window.alert(mensaje)
  } finally {
    input.value = ''
  }
}

async function sincronizarPlantilla(equipoId: number, jugadores: JugadorPersistido[]) {
  const actuales = jugadoresPorEquipo.value.get(equipoId) ?? []

  for (const jugador of actuales) {
    await eliminarJugador(jugador.id)
  }

  for (const jugador of jugadores) {
    await crearJugador({
      equipo_id: equipoId,
      nombre: jugador.nombre,
      numero_camiseta: jugador.dorsal,
    })
  }
}

async function cargarEquiposDesdeApi() {
  cargando.value = true
  try {
    const [listaEquipos, listaJugadores] = await Promise.all([
      listarEquipos(),
      listarJugadores(),
    ])

    const mapa = new Map<number, JugadorApi[]>()
    for (const jugador of listaJugadores) {
      const lista = mapa.get(jugador.equipo_id) ?? []
      lista.push(jugador)
      mapa.set(jugador.equipo_id, lista)
    }
    jugadoresPorEquipo.value = mapa

    equipos.value = listaEquipos.map((equipo) => ({
      id: equipo.id,
      nombre: equipo.nombre,
      escudoUrl: equipo.escudo_url,
      jugadores: (mapa.get(equipo.id) ?? []).map((j) => ({
        nombre: j.nombre,
        dorsal: j.numero_camiseta ?? 0,
      })),
    }))
  } catch {
    window.alert('No se pudieron cargar los equipos.')
  } finally {
    cargando.value = false
  }
}

async function guardarEquipo() {
  const nombre = equipoActual.value.nombre.trim()

  if (!nombre) {
    window.alert('Completá el nombre del club.')
    return
  }

  if (!plantillaValida.value) {
    window.alert(textoValidacionPlantilla.value)
    return
  }

  try {
    const datosEquipo: {
      nombre: string
      estado: 'Activo'
      escudo_url?: string | null
    } = {
      nombre,
      estado: 'Activo',
    }

    if (escudoMarcadoParaEliminar.value && !escudoArchivoPendiente.value) {
      datosEquipo.escudo_url = null
    }

    let equipoId = equipoActual.value.id
    if (equipoId) {
      await actualizarEquipo(equipoId, datosEquipo)
    } else {
      const creado = await crearEquipo(datosEquipo)
      equipoId = creado.id
    }

    if (escudoArchivoPendiente.value) {
      await subirEscudoEquipo(equipoId, escudoArchivoPendiente.value)
    }

    await sincronizarPlantilla(equipoId, equipoActual.value.jugadores)
    await cargarEquiposDesdeApi()
    cerrarModal()
  } catch {
    window.alert('No se pudo guardar el equipo.')
  }
}

async function eliminarEquipoPorId(id: number) {
  const equipo = equipos.value.find((e) => e.id === id)
  if (!equipo) return

  const confirmar = window.confirm(`¿Eliminar a "${equipo.nombre}"?`)
  if (!confirmar) return

  try {
    await eliminarEquipo(id)
    await cargarEquiposDesdeApi()
  } catch {
    window.alert('No se pudo eliminar el equipo.')
  }
}

onMounted(() => {
  cargarEquiposDesdeApi()
})
</script>

<template>
  <div class="mx-auto max-w-[90rem] space-y-6">
    <header>
      <h2 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Gestión de <span class="text-yellow-400">equipos</span>
      </h2>
      <p class="mt-2 text-sm text-zinc-400 sm:text-base">
        Clubes y plantillas del torneo (sincronizado con la API).
      </p>
    </header>

    <section
      class="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm"
    >
      <div
        class="flex flex-col gap-4 border-b border-zinc-800/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="relative min-w-0 flex-1 sm:max-w-md">
          <span
            class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              class="h-4 w-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
              />
            </svg>
          </span>
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar por nombre..."
            class="w-full rounded-lg border border-zinc-700/80 bg-zinc-950/50 py-2.5 pr-3 pl-10 text-sm text-white placeholder:text-zinc-500 focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
          />
        </div>

        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-2.5 text-sm font-extrabold tracking-wide text-black uppercase shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105"
          @click="abrirModalNuevo"
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
          Nuevo Equipo
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-sm">
          <thead>
            <tr
              class="border-b border-zinc-800/80 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase"
            >
              <th class="px-5 py-3">Nombre</th>
              <th class="px-3 py-3">Cantidad de jugadores</th>
              <th class="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="equiposFiltrados.length === 0" class="border-b border-zinc-800/60">
              <td colspan="3" class="px-5 py-12 text-center text-zinc-500">
                No hay equipos que coincidan con la búsqueda.
              </td>
            </tr>
            <tr
              v-for="equipo in equiposFiltrados"
              :key="equipo.id"
              class="border-b border-zinc-800/60 transition-colors last:border-b-0 hover:bg-zinc-800/30"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700/80 bg-zinc-800 text-[10px] font-bold text-yellow-400"
                  >
                    <img
                      v-if="equipo.escudoUrl"
                      :src="equipo.escudoUrl"
                      :alt="`Escudo de ${equipo.nombre}`"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>{{ inicialesEquipo(equipo.nombre) }}</span>
                  </span>
                  <span class="font-medium text-white">{{ equipo.nombre }}</span>
                </div>
              </td>
              <td class="px-3 py-3.5">
                <span
                  class="font-semibold tabular-nums"
                  :class="clasesCantidadJugadores(equipo.jugadores.length)"
                >
                  {{ textoCantidadJugadores(equipo) }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-zinc-700/80 px-2.5 py-1.5 text-xs font-medium text-yellow-400/90 transition-colors hover:border-yellow-500/40 hover:bg-yellow-500/10"
                    @click="abrirModalEditar(equipo)"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-zinc-700/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                    @click="eliminarEquipoPorId(equipo.id)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="border-t border-zinc-800/80 px-5 py-3 text-xs text-zinc-500">
        {{ equipos.length }} equipo(s) registrado(s)
        <span v-if="busqueda.trim()"> · {{ equiposFiltrados.length }} en esta búsqueda </span>
      </footer>
    </section>

    <Teleport to="body">
      <div
        v-if="modalAbierto"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-equipo"
      >
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          aria-hidden="true"
          @click="cerrarModal"
        />

        <form
          class="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
          @submit.prevent="guardarEquipo"
        >
          <header
            class="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800/80 px-6 py-4"
          >
            <div>
              <h3 id="titulo-modal-equipo" class="text-lg font-semibold text-white">
                {{ tituloModal }}
              </h3>
              <p class="mt-1 text-sm text-zinc-400">Datos del club y plantilla de jugadores.</p>
            </div>
            <button
              type="button"
              class="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              aria-label="Cerrar"
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

          <div class="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <!-- Datos del club -->
            <section class="space-y-4">
              <h4 class="text-sm font-semibold tracking-wide text-yellow-400 uppercase">
                Datos del club
              </h4>
              <div class="grid gap-4">
                <div>
                  <label for="equipo-nombre" class="mb-1.5 block text-sm font-medium text-zinc-300">
                    Nombre
                  </label>
                  <input
                    id="equipo-nombre"
                    v-model="equipoActual.nombre"
                    type="text"
                    required
                    autocomplete="off"
                    class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    placeholder="Ej. Tuca FC"
                  />
                </div>

                <div>
                  <p class="mb-1.5 block text-sm font-medium text-zinc-300">Escudo del equipo</p>
                  <div
                    class="flex flex-col gap-4 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-4 sm:flex-row sm:items-center"
                  >
                    <div
                      class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-700 bg-zinc-900"
                    >
                      <img
                        v-if="equipoActual.escudoUrl"
                        :src="equipoActual.escudoUrl"
                        alt="Vista previa del escudo"
                        class="h-full w-full object-cover"
                      />
                      <span
                        v-else
                        class="px-2 text-center text-xs font-semibold text-zinc-500"
                      >
                        Sin escudo
                      </span>
                    </div>

                    <div class="min-w-0 flex-1 space-y-2">
                      <p class="text-xs text-zinc-500">
                        JPG, PNG, WEBP o SVG · máx. {{ TAMANO_MAX_ESCUDO_MB }} MB · se optimiza al subir (hasta 512px)
                      </p>
                      <input
                        ref="inputArchivoEscudo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        class="sr-only"
                        @change="manejarEscudoSeleccionado"
                      />
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-yellow-400 transition-colors hover:border-yellow-500/40 hover:bg-yellow-500/10"
                          @click="abrirSelectorEscudo"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.75"
                            class="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M12 3 4 6.5v5.8c0 4.1 3.2 7.9 8 8.7 4.8-.8 8-4.6 8-8.7V6.5L12 3Z"
                            />
                          </svg>
                          Subir escudo
                        </button>
                        <button
                          v-if="equipoActual.escudoUrl"
                          type="button"
                          class="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-400"
                          @click="quitarEscudo"
                        >
                          Quitar imagen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Gestión de plantilla -->
            <section class="space-y-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
              <div class="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h4 class="text-sm font-semibold tracking-wide text-yellow-400 uppercase">
                    Gestión de plantilla
                  </h4>
                  <p
                    class="mt-1 text-sm"
                    :class="
                      plantillaValida
                        ? 'text-zinc-400'
                        : cantidadPlantillaActual > MAX_JUGADORES
                          ? 'text-red-400'
                          : 'text-amber-400'
                    "
                  >
                    {{ textoValidacionPlantilla }}
                    <span class="ml-1 tabular-nums text-white">
                      ({{ cantidadPlantillaActual }}/{{ MAX_JUGADORES }})
                    </span>
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <input
                    ref="inputArchivoExcel"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    class="sr-only"
                    @change="importarExcel"
                  />
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-yellow-400 transition-colors hover:border-yellow-500/40 hover:bg-yellow-500/10"
                    @click="abrirSelectorExcel"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
                      />
                      <path stroke-linecap="round" d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
                    </svg>
                    Importar Lista Excel
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 transition-colors hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:text-yellow-400"
                    title="Formato del Excel: columna A = número, columna B = nombre del jugador"
                    aria-label="Ayuda sobre el formato del Excel"
                    @click="mostrarAyudaFormatoExcel"
                  >
                    i
                  </button>
                </div>
              </div>

              <div
                class="flex flex-col gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3 sm:flex-row sm:items-end"
              >
                <div class="min-w-0 flex-1">
                  <label
                    for="jugador-nombre"
                    class="mb-1 block text-xs font-medium text-zinc-400"
                  >
                    Nombre del jugador
                  </label>
                  <input
                    id="jugador-nombre"
                    v-model="nombreJugadorNuevo"
                    type="text"
                    autocomplete="off"
                    class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    placeholder="Nombre y apellido"
                    @keyup.enter="agregarJugador"
                  />
                </div>
                <div class="w-full sm:w-28">
                  <label
                    for="jugador-dorsal"
                    class="mb-1 block text-xs font-medium text-zinc-400"
                  >
                    Dorsal
                  </label>
                  <input
                    id="jugador-dorsal"
                    v-model.number="dorsalJugadorNuevo"
                    type="number"
                    min="1"
                    max="99"
                    class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white tabular-nums focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    placeholder="10"
                    @keyup.enter="agregarJugador"
                  />
                </div>
                <button
                  type="button"
                  class="rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-2 text-sm font-bold text-black shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105 sm:shrink-0"
                  @click="agregarJugador"
                >
                  Agregar
                </button>
              </div>

              <div class="overflow-x-auto rounded-lg border border-zinc-800/80">
                <table class="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr
                      class="border-b border-zinc-800/80 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase"
                    >
                      <th class="px-4 py-2.5">Dorsal</th>
                      <th class="px-3 py-2.5">Nombre</th>
                      <th class="px-4 py-2.5 text-right">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="equipoActual.jugadores.length === 0">
                      <td colspan="3" class="px-4 py-8 text-center text-zinc-500">
                        Sin jugadores cargados. Agregá manualmente o importá desde Excel.
                      </td>
                    </tr>
                    <tr
                      v-for="(jugador, indice) in equipoActual.jugadores"
                      :key="`${jugador.dorsal}-${indice}`"
                      class="border-b border-zinc-800/60 last:border-b-0 hover:bg-zinc-800/20"
                    >
                      <td class="px-4 py-2.5 font-bold tabular-nums text-yellow-400">
                        {{ jugador.dorsal }}
                      </td>
                      <td class="px-3 py-2.5 text-white">{{ jugador.nombre }}</td>
                      <td class="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          class="text-xs text-zinc-400 transition-colors hover:text-red-400"
                          @click="quitarJugador(indice)"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <footer
            class="flex shrink-0 flex-wrap justify-end gap-2 border-t border-zinc-800/80 px-6 py-4"
          >
            <button
              type="button"
              class="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              @click="cerrarModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-2 text-sm font-bold text-black shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105"
            >
              Guardar equipo
            </button>
          </footer>
        </form>
      </div>
    </Teleport>
  </div>
</template>
