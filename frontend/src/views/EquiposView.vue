<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { estadioUrl } from '../assets/imagenes'
import { colorEscudoPorIndice, inicialesDeNombre } from '../api/mappers'
import { listarEquipos } from '../api/equiposApi'
import { listarJugadores } from '../api/jugadoresApi'
import EquipoCard from '../components/equipos/EquipoCard.vue'
import EquiposSkeleton from '../components/equipos/EquiposSkeleton.vue'
import HomeEmptyState from '../components/home/HomeEmptyState.vue'

type JugadorEquipo = {
  nombre: string
  numeroCamiseta: number | null
}

type EquipoTarjeta = {
  id: number
  nombre: string
  subtitulo: string
  iniciales: string
  colorEscudo: string
  escudoUrl: string | null
  jugadores: JugadorEquipo[]
}

const equipos = ref<EquipoTarjeta[]>([])
const busqueda = ref('')
const equipoSeleccionado = ref<EquipoTarjeta | null>(null)
const cargando = ref(false)
const errorCarga = ref<string | null>(null)

const equiposFiltrados = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()
  return equipos.value.filter((equipo) => {
    if (termino.length === 0) return true
    return (
      equipo.nombre.toLowerCase().includes(termino) ||
      equipo.subtitulo.toLowerCase().includes(termino)
    )
  })
})

const cantidadEquipos = computed(() => equipos.value.length)

const totalJugadores = computed(() =>
  equipos.value.reduce((suma, equipo) => suma + equipo.jugadores.length, 0),
)

const sinResultadosBusqueda = computed(
  () =>
    !cargando.value &&
    !errorCarga.value &&
    equipos.value.length > 0 &&
    equiposFiltrados.value.length === 0,
)

const jugadoresOrdenados = computed(() => {
  const lista = equipoSeleccionado.value?.jugadores ?? []
  return [...lista].sort((a, b) => {
    const na = a.numeroCamiseta ?? Number.MAX_SAFE_INTEGER
    const nb = b.numeroCamiseta ?? Number.MAX_SAFE_INTEGER
    if (na !== nb) return na - nb
    return a.nombre.localeCompare(b.nombre, 'es')
  })
})

function colorTextoEscudo(colorEscudo: string): string {
  return colorEscudo === '#e2e8f0' || colorEscudo === '#f8fafc' ? '#0f172a' : 'white'
}

function abrirDetalle(equipo: EquipoTarjeta) {
  equipoSeleccionado.value = equipo
}

function cerrarDetalle() {
  equipoSeleccionado.value = null
}

function limpiarBusqueda() {
  busqueda.value = ''
}

function manejarTeclaEscape(evento: KeyboardEvent) {
  if (evento.key === 'Escape' && equipoSeleccionado.value) {
    cerrarDetalle()
  }
}

async function cargarEquiposDesdeApi() {
  cargando.value = true
  errorCarga.value = null
  try {
    const [equiposApi, jugadoresApi] = await Promise.all([listarEquipos(), listarJugadores()])

    equipos.value = equiposApi.map((equipo, indice) => ({
      id: equipo.id,
      nombre: equipo.nombre,
      subtitulo:
        equipo.instagram?.trim() ||
        (equipo.estado === 'Activo' ? 'Equipo activo' : 'Equipo del torneo'),
      iniciales: inicialesDeNombre(equipo.nombre) || 'EQ',
      colorEscudo: colorEscudoPorIndice(indice),
      escudoUrl: equipo.escudo_url,
      jugadores: jugadoresApi
        .filter((j) => j.equipo_id === equipo.id)
        .map((j) => ({
          nombre: j.nombre,
          numeroCamiseta: j.numero_camiseta,
        })),
    }))
  } catch {
    errorCarga.value = 'No se pudieron cargar los equipos.'
    equipos.value = []
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', manejarTeclaEscape)
  cargarEquiposDesdeApi()
})

onUnmounted(() => {
  window.removeEventListener('keydown', manejarTeclaEscape)
})
</script>

<template>
  <div class="relative min-h-full text-white">
    <div
      class="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat max-lg:bg-scroll lg:bg-fixed"
      :style="{ backgroundImage: `url(${estadioUrl})` }"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-black/70 via-black/80 to-slate-950/95"
      aria-hidden="true"
    />

    <section class="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <header class="mb-6 sm:mb-8">
        <div class="flex flex-wrap justify-center gap-2 sm:justify-start">
          <span
            class="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold tracking-wider text-yellow-300 uppercase"
          >
            Pro League Universitaria
          </span>
          <span
            v-if="cantidadEquipos > 0"
            class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-wider text-white/80 uppercase"
          >
            {{ cantidadEquipos }} equipos
          </span>
          <span
            v-if="totalJugadores > 0"
            class="inline-flex items-center rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-[10px] font-bold tracking-wider text-sky-200 uppercase"
          >
            {{ totalJugadores }} jugadores
          </span>
        </div>

        <h1
          class="titulo-pincel mt-4 text-center font-oswald text-4xl font-black uppercase italic tracking-tight text-yellow-400 sm:text-left sm:text-5xl md:text-6xl"
        >
          Equipos
        </h1>
        <p
          class="mt-3 text-center text-sm text-slate-400 sm:text-left sm:text-base"
        >
          Explorá los clubes del torneo, su plantel y escudos oficiales.
        </p>
      </header>

      <div
        class="mb-6 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-sm backdrop-blur-sm sm:p-5"
      >
        <label for="buscar-equipo" class="sr-only">Buscar equipo</label>
        <div class="relative">
          <span
            class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </svg>
          </span>
          <input
            id="buscar-equipo"
            v-model="busqueda"
            type="search"
            placeholder="Buscar por nombre o subtítulo..."
            class="w-full rounded-xl border border-slate-700/80 bg-slate-950/50 py-3.5 pl-12 pr-4 font-oswald text-sm uppercase tracking-wide text-white placeholder:text-slate-500 transition-all duration-200 focus:border-yellow-400/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
          />
        </div>
        <p
          v-if="busqueda.trim() && !cargando"
          class="mt-3 text-center text-xs font-semibold text-slate-500 sm:text-left"
        >
          {{ equiposFiltrados.length }}
          {{ equiposFiltrados.length === 1 ? 'resultado' : 'resultados' }}
        </p>
      </div>

      <EquiposSkeleton v-if="cargando" />

      <HomeEmptyState
        v-else-if="errorCarga"
        variante="tabla"
        titulo="Error al cargar"
        :descripcion="errorCarga"
      />

      <HomeEmptyState
        v-else-if="equipos.length === 0"
        variante="tabla"
        titulo="Sin equipos registrados"
        descripcion="Cuando se den de alta los clubes del torneo, aparecerán en esta página."
      />

      <div v-else-if="sinResultadosBusqueda" class="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
        <HomeEmptyState
          variante="calendario"
          titulo="Sin coincidencias"
          descripcion="Probá con otro nombre o limpiá el filtro de búsqueda."
        />
        <div class="mt-4 flex justify-center">
          <button
            type="button"
            class="rounded-xl border border-yellow-400/40 px-4 py-2 text-xs font-bold tracking-wider text-yellow-400 uppercase transition-all duration-200 hover:scale-[1.02] hover:bg-yellow-400/10"
            @click="limpiarBusqueda"
          >
            Limpiar búsqueda
          </button>
        </div>
      </div>

      <ul
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
      >
        <li v-for="equipo in equiposFiltrados" :key="equipo.id">
          <EquipoCard
            :nombre="equipo.nombre"
            :subtitulo="equipo.subtitulo"
            :iniciales="equipo.iniciales"
            :color-escudo="equipo.colorEscudo"
            :escudo-url="equipo.escudoUrl"
            :cantidad-jugadores="equipo.jugadores.length"
            :color-texto-escudo="colorTextoEscudo(equipo.colorEscudo)"
            @abrir="abrirDetalle(equipo)"
          />
        </li>
      </ul>
    </section>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="equipoSeleccionado"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="'titulo-equipo-' + equipoSeleccionado.id"
        >
          <button
            type="button"
            class="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Cerrar detalle del equipo"
            @click="cerrarDetalle"
          />

          <div
            class="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-black/50"
          >
            <button
              type="button"
              class="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition-all duration-200 hover:scale-105 hover:border-slate-500 hover:text-white"
              aria-label="Cerrar"
              @click="cerrarDetalle"
            >
              ✕
            </button>

            <div class="flex min-h-0 flex-1 flex-col md:flex-row">
              <aside
                class="flex shrink-0 flex-col items-center justify-center border-b border-slate-800/80 bg-slate-900/50 px-6 py-10 md:w-[38%] md:border-b-0 md:border-r"
              >
                <div
                  v-if="equipoSeleccionado.escudoUrl"
                  class="mb-5 h-36 w-36 overflow-hidden rounded-full ring-2 ring-yellow-500/40"
                >
                  <img
                    :src="equipoSeleccionado.escudoUrl"
                    :alt="`Escudo de ${equipoSeleccionado.nombre}`"
                    class="h-full w-full object-cover"
                  />
                </div>
                <div
                  v-else
                  class="mb-5 flex h-36 w-36 items-center justify-center rounded-full text-4xl font-black ring-2 ring-yellow-500/40"
                  :style="{
                    backgroundColor: equipoSeleccionado.colorEscudo,
                    color: colorTextoEscudo(equipoSeleccionado.colorEscudo),
                  }"
                >
                  {{ equipoSeleccionado.iniciales }}
                </div>
                <h2
                  :id="'titulo-equipo-' + equipoSeleccionado.id"
                  class="text-center font-oswald text-2xl font-bold uppercase tracking-wide text-yellow-400"
                >
                  {{ equipoSeleccionado.nombre }}
                </h2>
                <p class="mt-2 text-center text-sm text-sky-300/90">
                  {{ equipoSeleccionado.subtitulo }}
                </p>
                <p
                  class="mt-4 rounded-full border border-slate-700/80 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                >
                  {{ jugadoresOrdenados.length }}
                  {{ jugadoresOrdenados.length === 1 ? 'jugador' : 'jugadores' }}
                </p>
              </aside>

              <div class="flex min-h-0 flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
                <h3
                  class="mb-4 font-oswald text-sm font-semibold uppercase tracking-[0.2em] text-sky-300"
                >
                  Plantel
                </h3>
                <ul
                  v-if="jugadoresOrdenados.length > 0"
                  class="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
                  role="list"
                >
                  <li
                    v-for="(jugador, indice) in jugadoresOrdenados"
                    :key="indice"
                    class="flex items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 transition-all duration-200 hover:scale-[1.01] hover:bg-slate-900/80"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400/15 font-oswald text-sm font-bold text-yellow-400"
                    >
                      {{ jugador.numeroCamiseta ?? '—' }}
                    </span>
                    <span
                      class="font-oswald text-sm font-medium uppercase tracking-wide text-white"
                    >
                      {{ jugador.nombre }}
                    </span>
                  </li>
                </ul>
                <HomeEmptyState
                  v-else
                  variante="tabla"
                  titulo="Plantel vacío"
                  descripcion="Este equipo aún no tiene jugadores cargados."
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');

.font-oswald {
  font-family: Oswald, system-ui, sans-serif;
}

.titulo-pincel {
  text-shadow: 2px 2px rgba(0, 0, 0, 0.5), 0 0 40px rgba(250, 204, 21, 0.35);
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.4));
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
