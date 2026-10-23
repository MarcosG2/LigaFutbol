<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { colorEscudoPorIndice, inicialesDeNombre } from '../../api/mappers'
import { listarSancionesTorneo, registrarSancionTorneo } from '../../api/sancionesApi'
import { obtenerTablaTorneo, obtenerTorneoActivo } from '../../api/torneosApi'

type SancionEquipo = {
  fecha: string
  puntos: number
  motivo: string
}

type EquipoTabla = {
  id: number
  nombre: string
  iniciales: string
  colorEscudo: string
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  pts: number
  puntos_descontados: number
  sanciones: SancionEquipo[]
}

type EntradaLogInfraccion = {
  id: string
  fecha: string
  nombreEquipo: string
  puntosRestados: number
  motivo: string
}

type FilaTabla = EquipoTabla & {
  posicion: number
  pts: number
  dg: number
}

const equipos = ref<EquipoTabla[]>([])
const torneoActivoId = ref<number | null>(null)
const guardandoSancion = ref(false)

function mapearSancionesAlLog(sanciones: Awaited<ReturnType<typeof listarSancionesTorneo>>) {
  logInfraccionesGlobal.value = sanciones.map((sancion) => ({
    id: String(sancion.id),
    fecha: sancion.creado_en,
    nombreEquipo: sancion.nombre_equipo,
    puntosRestados: sancion.puntos,
    motivo: sancion.motivo,
  }))
}

async function cargarTablaAdmin() {
  const torneo = await obtenerTorneoActivo()
  if (!torneo) {
    torneoActivoId.value = null
    equipos.value = []
    logInfraccionesGlobal.value = []
    return
  }

  torneoActivoId.value = torneo.id

  const [filas, sanciones] = await Promise.all([
    obtenerTablaTorneo(torneo.id),
    listarSancionesTorneo(torneo.id),
  ])

  const sancionesPorEquipo = new Map<number, SancionEquipo[]>()
  for (const sancion of sanciones) {
    const lista = sancionesPorEquipo.get(sancion.equipo_id) ?? []
    lista.push({
      fecha: sancion.creado_en,
      puntos: sancion.puntos,
      motivo: sancion.motivo,
    })
    sancionesPorEquipo.set(sancion.equipo_id, lista)
  }

  equipos.value = filas.map((fila, indice) => ({
    id: fila.equipo_id,
    nombre: fila.nombre,
    iniciales: inicialesDeNombre(fila.nombre),
    colorEscudo: colorEscudoPorIndice(indice),
    pj: fila.pj,
    pg: fila.pg,
    pe: fila.pe,
    pp: fila.pp,
    gf: fila.gf,
    gc: fila.gc,
    pts: fila.pts,
    puntos_descontados: fila.puntos_descontados ?? 0,
    sanciones: sancionesPorEquipo.get(fila.equipo_id) ?? [],
  }))

  mapearSancionesAlLog(sanciones)
}

onMounted(() => {
  cargarTablaAdmin().catch(() => {
    window.alert('No se pudo cargar la tabla desde el servidor.')
  })
})

const logInfraccionesGlobal = ref<EntradaLogInfraccion[]>([])

const modalSancionAbierto = ref(false)
const panelLogAbierto = ref(false)
const equipoSancionId = ref<number | null>(null)
const puntosADescontar = ref<number | ''>('')
const motivoInfraccion = ref('')

const equipoEnSancion = computed(() =>
  equipos.value.find((e) => e.id === equipoSancionId.value) ?? null,
)

const tablaOrdenada = computed<FilaTabla[]>(() =>
  equipos.value
    .map((equipo) => ({
      ...equipo,
      dg: equipo.gf - equipo.gc,
      posicion: 0,
    }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
    .map((fila, indice) => ({ ...fila, posicion: indice + 1 })),
)

const logOrdenado = computed(() =>
  [...logInfraccionesGlobal.value].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  ),
)

function colorTextoEscudo(colorEscudo: string): string {
  return colorEscudo === '#e2e8f0' || colorEscudo === '#f8fafc' ? '#0f172a' : 'white'
}

function clasesPosicion(posicion: number): string {
  if (posicion <= 4) return 'bg-green-600/25 text-green-400'
  if (posicion <= 6) return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-red-600/25 text-red-400'
}

function formatearFechaLog(fechaIso: string) {
  const fecha = new Date(fechaIso)
  if (Number.isNaN(fecha.getTime())) return fechaIso
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)
}

function abrirModalSancion(equipoId: number) {
  equipoSancionId.value = equipoId
  puntosADescontar.value = ''
  motivoInfraccion.value = ''
  modalSancionAbierto.value = true
}

function cerrarModalSancion() {
  modalSancionAbierto.value = false
  equipoSancionId.value = null
}

function abrirPanelLog() {
  panelLogAbierto.value = true
}

function cerrarPanelLog() {
  panelLogAbierto.value = false
}

async function confirmarSancion() {
  if (!equipoSancionId.value || torneoActivoId.value === null) return

  const puntos =
    puntosADescontar.value === '' ? NaN : Number(puntosADescontar.value)
  const motivo = motivoInfraccion.value.trim()

  if (!Number.isFinite(puntos) || puntos <= 0 || !Number.isInteger(puntos)) {
    window.alert('Ingresá una cantidad entera de puntos mayor a 0.')
    return
  }

  if (!motivo) {
    window.alert('Indicá el motivo de la infracción.')
    return
  }

  guardandoSancion.value = true
  try {
    await registrarSancionTorneo(torneoActivoId.value, {
      equipo_id: equipoSancionId.value,
      puntos,
      motivo,
    })
    await cargarTablaAdmin()
    cerrarModalSancion()
  } catch {
    window.alert('No se pudo guardar la sanción. Verificá que estés logueado como admin.')
  } finally {
    guardandoSancion.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[90rem] space-y-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Tabla de <span class="text-yellow-400">posiciones</span>
        </h2>
        <p class="mt-2 text-sm text-zinc-400 sm:text-base">
          Estadísticas del torneo, puntos calculados y sanciones disciplinarias persistidas en la base de datos.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-yellow-500/40 hover:bg-zinc-800 hover:text-yellow-400"
        @click="abrirPanelLog"
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
            d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        Historial de infracciones
        <span
          v-if="logInfraccionesGlobal.length > 0"
          class="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-400"
        >
          {{ logInfraccionesGlobal.length }}
        </span>
      </button>
    </header>

    <section
      class="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm"
      aria-label="Tabla de posiciones"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[960px] text-sm">
          <thead>
            <tr
              class="border-b border-zinc-800/80 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase"
            >
              <th class="px-4 py-3 text-center">#</th>
              <th class="px-3 py-3">Equipo</th>
              <th class="px-2 py-3 text-center">PJ</th>
              <th class="px-2 py-3 text-center">PG</th>
              <th class="px-2 py-3 text-center">PE</th>
              <th class="px-2 py-3 text-center">PP</th>
              <th class="px-2 py-3 text-center">GF</th>
              <th class="px-2 py-3 text-center">GC</th>
              <th class="px-2 py-3 text-center">DG</th>
              <th class="px-2 py-3 text-center">PTS</th>
              <th class="px-3 py-3 text-center">Sanciones</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fila in tablaOrdenada"
              :key="fila.id"
              class="border-b border-zinc-800/50 transition-colors hover:bg-white/[0.02]"
            >
              <td class="px-4 py-3 text-center">
                <span
                  class="inline-flex h-7 min-w-7 items-center justify-center rounded-md text-xs font-bold"
                  :class="clasesPosicion(fila.posicion)"
                >
                  {{ fila.posicion }}
                </span>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    :style="{ backgroundColor: fila.colorEscudo, color: colorTextoEscudo(fila.colorEscudo) }"
                  >
                    {{ fila.iniciales }}
                  </span>
                  <span class="font-medium text-white">{{ fila.nombre }}</span>
                </div>
              </td>
              <td class="px-2 py-3 text-center tabular-nums text-zinc-300">{{ fila.pj }}</td>
              <td class="px-2 py-3 text-center tabular-nums text-zinc-300">{{ fila.pg }}</td>
              <td class="px-2 py-3 text-center tabular-nums text-zinc-300">{{ fila.pe }}</td>
              <td class="px-2 py-3 text-center tabular-nums text-zinc-300">{{ fila.pp }}</td>
              <td class="px-2 py-3 text-center tabular-nums text-zinc-300">{{ fila.gf }}</td>
              <td class="px-2 py-3 text-center tabular-nums text-zinc-300">{{ fila.gc }}</td>
              <td
                class="px-2 py-3 text-center tabular-nums font-medium"
                :class="fila.dg > 0 ? 'text-green-400' : fila.dg < 0 ? 'text-red-400' : 'text-zinc-400'"
              >
                {{ fila.dg > 0 ? `+${fila.dg}` : fila.dg }}
              </td>
              <td class="px-2 py-3 text-center tabular-nums text-lg font-bold text-yellow-400">
                {{ fila.pts }}
              </td>
              <td class="px-3 py-3 text-center">
                <span
                  v-if="fila.puntos_descontados > 0"
                  class="text-xs font-semibold text-red-400"
                >
                  -{{ fila.puntos_descontados }} PTS
                </span>
                <span v-else class="text-xs text-zinc-600">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:border-amber-400/50 hover:bg-amber-500/20"
                  @click="abrirModalSancion(fila.id)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    class="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" d="M5 12h14" />
                  </svg>
                  Restar puntos
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="border-t border-zinc-800/80 px-4 py-3 text-xs text-zinc-500">
        PTS = (PG × 3) + (PE × 1) − puntos descontados por sanciones.
      </p>
    </section>

    <!-- Modal sanción -->
    <Teleport to="body">
      <div
        v-if="modalSancionAbierto && equipoEnSancion"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-sancion"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          aria-label="Cerrar"
          @click="cerrarModalSancion"
        />

        <div
          class="relative z-10 w-full max-w-md rounded-xl border border-zinc-700/80 bg-zinc-900 p-6 shadow-2xl shadow-black/50"
        >
          <h3 id="titulo-modal-sancion" class="text-lg font-semibold text-white">
            Aplicar sanción
          </h3>
          <p class="mt-1 text-sm text-zinc-400">
            Equipo:
            <span class="font-medium text-yellow-400">{{ equipoEnSancion.nombre }}</span>
          </p>

          <form class="mt-5 space-y-4" @submit.prevent="confirmarSancion">
            <div>
              <label for="puntos-descontar" class="mb-1.5 block text-xs font-medium text-zinc-400">
                Puntos a descontar
              </label>
              <input
                id="puntos-descontar"
                v-model.number="puntosADescontar"
                type="number"
                min="1"
                step="1"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none ring-yellow-500/0 transition-shadow focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20"
                placeholder="Ej: 3"
              />
            </div>

            <div>
              <label for="motivo-infraccion" class="mb-1.5 block text-xs font-medium text-zinc-400">
                Motivo de la infracción
              </label>
              <textarea
                id="motivo-infraccion"
                v-model="motivoInfraccion"
                rows="4"
                required
                class="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-shadow focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20"
                placeholder="Ej: Jugador sancionado por doble amarilla en Fecha 5"
              />
            </div>

            <div class="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                class="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
                @click="cerrarModalSancion"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="rounded-lg bg-gradient-to-b from-red-500 to-red-700 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-900/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="guardandoSancion"
              >
                {{ guardandoSancion ? 'Guardando…' : 'Confirmar sanción' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Slide-over historial -->
    <Teleport to="body">
      <div v-if="panelLogAbierto" class="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-label="Cerrar historial"
          @click="cerrarPanelLog"
        />

        <aside
          class="relative flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-900 shadow-2xl"
          role="dialog"
          aria-labelledby="titulo-panel-log"
        >
          <header class="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
            <div>
              <h3 id="titulo-panel-log" class="text-lg font-semibold text-white">
                Historial de infracciones
              </h3>
              <p class="mt-1 text-xs text-zinc-500">Auditoría de sanciones del torneo</p>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
              aria-label="Cerrar panel"
              @click="cerrarPanelLog"
            >
              ✕
            </button>
          </header>

          <div class="flex-1 overflow-y-auto p-4">
            <ul v-if="logOrdenado.length > 0" class="space-y-3">
              <li
                v-for="entrada in logOrdenado"
                :key="entrada.id"
                class="rounded-lg border border-zinc-800/80 bg-zinc-950/80 p-4"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="font-medium text-white">{{ entrada.nombreEquipo }}</p>
                  <span class="shrink-0 text-sm font-bold text-red-400">
                    −{{ entrada.puntosRestados }} PTS
                  </span>
                </div>
                <p class="mt-1 text-xs text-zinc-500">{{ formatearFechaLog(entrada.fecha) }}</p>
                <p class="mt-2 text-sm text-zinc-300">{{ entrada.motivo }}</p>
              </li>
            </ul>

            <p v-else class="py-12 text-center text-sm text-zinc-500">
              No se registraron infracciones todavía.
            </p>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>
