<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { estadioUrl } from '../assets/imagenes'
import { colorEscudoPorIndice, inicialesDeNombre } from '../api/mappers'
import { listarEquipos } from '../api/equiposApi'
import { listarJugadores } from '../api/jugadoresApi'

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

function colorTextoEscudo(colorEscudo: string): string {
  return colorEscudo === '#e2e8f0' || colorEscudo === '#f8fafc' ? '#0f172a' : 'white'
}

function abrirDetalle(equipo: EquipoTarjeta) {
  equipoSeleccionado.value = equipo
}

function cerrarDetalle() {
  equipoSeleccionado.value = null
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
      subtitulo: equipo.instagram?.trim() || (equipo.estado === 'Activo' ? 'Equipo activo' : 'Equipo del torneo'),
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
      class="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-black/70 via-black/80 to-zinc-950/95"
      aria-hidden="true"
    />

    <section class="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <header class="mb-8 text-center sm:text-left">
        <h1
          class="titulo-pincel font-oswald text-4xl font-black uppercase italic tracking-tight text-yellow-400 sm:text-5xl md:text-6xl"
        >
          Equipos
        </h1>
        <p
          class="mt-3 font-oswald text-sm font-medium uppercase italic tracking-[0.2em] text-sky-300/90 sm:text-base"
        >
          Conocé a todos los equipos del torneo
        </p>
      </header>

      <div class="mb-6">
        <label for="buscar-equipo" class="sr-only">Buscar equipo</label>
        <div class="relative">
          <span
            class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
            placeholder="Buscar equipo..."
            class="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/70 py-3.5 pl-12 pr-4 font-oswald text-sm uppercase tracking-wide text-white placeholder:text-zinc-500 backdrop-blur-sm transition-colors focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>

      <p v-if="cargando" class="mb-4 text-center text-sm text-zinc-400">Cargando equipos...</p>
      <p v-else-if="errorCarga" class="mb-4 text-center text-sm text-red-400">{{ errorCarga }}</p>

      <div
        v-if="!cargando && equiposFiltrados.length === 0"
        class="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center text-zinc-400"
      >
        No hay equipos que coincidan con tu búsqueda.
      </div>

      <ul
        v-else-if="equiposFiltrados.length > 0"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
      >
        <li v-for="equipo in equiposFiltrados" :key="equipo.id">
          <button
            type="button"
            class="tarjeta-equipo group flex w-full flex-col items-center rounded-2xl border border-sky-500/25 bg-zinc-900/55 px-4 py-8 text-center shadow-lg shadow-black/25 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-sky-400/45 hover:bg-zinc-900/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/60"
            @click="abrirDetalle(equipo)"
          >
            <div
              v-if="equipo.escudoUrl"
              class="mb-4 h-24 w-24 overflow-hidden rounded-full ring-2 ring-white/10"
            >
              <img
                :src="equipo.escudoUrl"
                :alt="`Escudo de ${equipo.nombre}`"
                class="h-full w-full object-cover"
              />
            </div>
            <div
              v-else
              class="mb-4 flex h-24 w-24 items-center justify-center rounded-full text-2xl font-black shadow-inner ring-2 ring-white/10 transition-transform group-hover:scale-105"
              :style="{
                backgroundColor: equipo.colorEscudo,
                color: colorTextoEscudo(equipo.colorEscudo),
              }"
            >
              {{ equipo.iniciales }}
            </div>
            <h2 class="font-oswald text-lg font-bold uppercase tracking-wide text-white">
              {{ equipo.nombre }}
            </h2>
            <p class="mt-1 text-sm text-sky-300/80">{{ equipo.subtitulo }}</p>
          </button>
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
            class="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-sky-500/30 bg-zinc-950/95 shadow-2xl shadow-black/50"
          >
            <button
              type="button"
              class="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              aria-label="Cerrar"
              @click="cerrarDetalle"
            >
              ✕
            </button>

            <div class="flex min-h-0 flex-1 flex-col md:flex-row">
              <aside
                class="flex shrink-0 flex-col items-center justify-center border-b border-zinc-800 bg-zinc-900/50 px-6 py-10 md:w-[38%] md:border-b-0 md:border-r"
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
              </aside>

              <div class="flex min-h-0 flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
                <h3 class="mb-4 font-oswald text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                  Plantel
                </h3>
                <ul
                  v-if="equipoSeleccionado.jugadores.length > 0"
                  class="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
                  role="list"
                >
                  <li
                    v-for="(jugador, indice) in equipoSeleccionado.jugadores"
                    :key="indice"
                    class="flex items-center gap-4 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-4 py-3"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 font-oswald text-sm font-bold text-yellow-400"
                    >
                      {{ jugador.numeroCamiseta ?? '—' }}
                    </span>
                    <span class="font-oswald text-sm font-medium uppercase tracking-wide text-white">
                      {{ jugador.nombre }}
                    </span>
                  </li>
                </ul>
                <p v-else class="text-sm text-zinc-500">Este equipo aún no tiene jugadores cargados.</p>
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

.tarjeta-equipo {
  min-height: 220px;
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
