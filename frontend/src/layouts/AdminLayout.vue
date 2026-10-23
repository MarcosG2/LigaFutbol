<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { estadioUrl, logoUrl } from '../assets/imagenes'
import { cerrarSesion, obtenerSesion } from '../api/authApi'
import {
  cargarPartidosAdmin,
  usarNotificacionesPartidos,
} from '../composables/estadoPartidosAdmin'

const {
  panelAbierto: panelNotificacionesAbierto,
  partidosFinalizados,
  cantidadNoLeidas,
  alternarPanel: alternarPanelNotificaciones,
  cerrarPanel: cerrarPanelNotificaciones,
  formatearFechaPartido,
} = usarNotificacionesPartidos()

const contenedorNotificacionesRef = ref<HTMLElement | null>(null)
const menuMovilAbierto = ref(false)

function alternarMenuMovil() {
  menuMovilAbierto.value = !menuMovilAbierto.value
}

function cerrarMenuMovil() {
  menuMovilAbierto.value = false
}

const route = useRoute()
const router = useRouter()

watch(
  () => route.path,
  () => {
    cerrarMenuMovil()
  },
)
const sesionAdmin = computed(() => obtenerSesion())

function salirDelPanel() {
  cerrarMenuMovil()
  cerrarSesion()
  router.push('/login')
}

type ItemMenu = {
  etiqueta: string
  ruta: string
  icono: 'inicio' | 'torneo' | 'equipos' | 'partidos' | 'tabla'
}

const itemsMenu: ItemMenu[] = [
  { etiqueta: 'Inicio', ruta: '/admin', icono: 'inicio' },
  { etiqueta: 'Torneo', ruta: '/admin/torneo', icono: 'torneo' },
  { etiqueta: 'Equipos', ruta: '/admin/equipos', icono: 'equipos' },
  { etiqueta: 'Partidos', ruta: '/admin/partidos', icono: 'partidos' },
  { etiqueta: 'Tabla de posiciones', ruta: '/admin/tabla', icono: 'tabla' },
]

const fechaHoraTexto = ref('')

let intervaloReloj: ReturnType<typeof setInterval> | undefined

function actualizarReloj() {
  const ahora = new Date()
  fechaHoraTexto.value = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(ahora)
}

function itemActivo(rutaItem: string) {
  if (rutaItem === '/admin') {
    return route.path === '/admin' || route.path === '/admin/'
  }
  return route.path === rutaItem || route.path.startsWith(`${rutaItem}/`)
}

function clasesItemMenu(rutaItem: string) {
  const activo = itemActivo(rutaItem)
  return [
    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    activo
      ? 'border-l-2 border-yellow-400 bg-yellow-500/10 text-yellow-400'
      : 'border-l-2 border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
  ]
}

const anioActual = computed(() => new Date().getFullYear())

function manejarClickFueraNotificaciones(evento: MouseEvent) {
  if (!panelNotificacionesAbierto.value) return
  const objetivo = evento.target
  if (!(objetivo instanceof Node)) return
  if (contenedorNotificacionesRef.value?.contains(objetivo)) return
  cerrarPanelNotificaciones()
}

onMounted(() => {
  actualizarReloj()
  intervaloReloj = setInterval(actualizarReloj, 30_000)
  document.addEventListener('click', manejarClickFueraNotificaciones)
  cargarPartidosAdmin().catch(() => undefined)
})

onUnmounted(() => {
  if (intervaloReloj !== undefined) {
    clearInterval(intervaloReloj)
  }
  document.removeEventListener('click', manejarClickFueraNotificaciones)
})
</script>

<template>
  <div class="flex min-h-0 flex-1 bg-zinc-950 text-white">
    <button
      v-if="menuMovilAbierto"
      type="button"
      class="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden"
      aria-label="Cerrar menú"
      @click="cerrarMenuMovil"
    />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex max-h-dvh w-[min(100%,18rem)] flex-col border-r border-white/[0.06] bg-zinc-950 shadow-2xl shadow-black/50 transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none lg:sticky lg:top-0 lg:max-h-dvh lg:self-start"
      :class="menuMovilAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      aria-label="Menú de administración"
    >
      <div class="border-b border-white/[0.06] px-5 py-6">
        <RouterLink to="/admin" class="flex items-center gap-3 transition-opacity hover:opacity-90">
          <img
            :src="logoUrl"
            alt="PLU - Pro League Universitaria"
            class="h-11 w-11 shrink-0 object-contain"
            width="44"
            height="44"
          />
          <p
            class="min-w-0 font-oswald text-[10px] font-bold leading-snug tracking-[0.14em] text-zinc-200 uppercase"
          >
            Pro League<br />Universitaria
          </p>
        </RouterLink>
      </div>

      <nav id="menu-admin" class="flex-1 overflow-y-auto px-3 py-4">
        <ul class="space-y-1">
          <li v-for="item in itemsMenu" :key="item.ruta">
            <RouterLink :to="item.ruta" :class="clasesItemMenu(item.ruta)">
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-900/80 text-current"
                aria-hidden="true"
              >
                <svg
                  v-if="item.icono === 'inicio'"
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
                    d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"
                  />
                </svg>
                <svg
                  v-else-if="item.icono === 'torneo'"
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
                    d="M8 21h8M12 17v4M7 4h10l1 7H6l1-7Zm1 7a4 4 0 0 0 8 0"
                  />
                </svg>
                <svg
                  v-else-if="item.icono === 'equipos'"
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
                    d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11ZM8 13c1.657 0 3-1.567 3-3.5S9.657 6 8 6 5 7.567 5 9.5 7.343 13 8 13Zm8 2c-2.21 0-4 1.343-4 3v1h8v-1c0-1.657-1.79-3-4-3ZM8 15c-2.21 0-4 1.343-4 3v1h8v-1c0-1.657-1.79-3-4-3Z"
                  />
                </svg>
                <svg
                  v-else-if="item.icono === 'partidos'"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  class="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path stroke-linecap="round" d="M12 3c2.5 2.2 4 5.4 4 9s-1.5 6.8-4 9M12 3c-2.5 2.2-4 5.4-4 9s1.5 6.8 4 9M3 12h18" />
                </svg>
                <svg
                  v-else-if="item.icono === 'tabla'"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  class="h-4 w-4"
                >
                  <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              </span>
              <span class="truncate">{{ item.etiqueta }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="mt-auto border-t border-white/[0.06] p-3 lg:hidden">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs font-semibold tracking-wide text-red-400 uppercase transition-colors hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300"
          @click="salirDelPanel"
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
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Columna principal -->
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        class="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url(${estadioUrl})` }"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 via-zinc-950/90 to-zinc-950"
        aria-hidden="true"
      />

      <header
        class="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] bg-zinc-900/90 px-4 backdrop-blur-md sm:h-16 sm:gap-4 sm:px-6"
      >
        <div class="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            :aria-expanded="menuMovilAbierto"
            aria-controls="menu-admin"
            aria-label="Abrir menú de navegación"
            @click="alternarMenuMovil"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <h1
            class="truncate font-oswald text-base font-semibold tracking-wide text-white sm:text-lg md:text-xl"
          >
            Panel de Administración
          </h1>
        </div>

        <div class="flex shrink-0 items-center gap-2 sm:gap-4 md:gap-6">
          <div ref="contenedorNotificacionesRef" class="relative">
            <button
              type="button"
              class="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-yellow-400"
              :class="panelNotificacionesAbierto ? 'bg-white/5 text-yellow-400' : ''"
              aria-label="Notificaciones de partidos finalizados"
              :aria-expanded="panelNotificacionesAbierto"
              aria-haspopup="true"
              @click.stop="alternarPanelNotificaciones"
            >
              <span
                v-if="cantidadNoLeidas > 0"
                class="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-bold text-zinc-950"
              >
                {{ cantidadNoLeidas > 9 ? '9+' : cantidadNoLeidas }}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                class="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.04-.59 1.4L4 17h5m6 0a3 3 0 0 1-6 0"
                />
              </svg>
            </button>

            <div
              v-if="panelNotificacionesAbierto"
              class="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-xl shadow-black/40"
              role="region"
              aria-label="Partidos finalizados"
              @click.stop
            >
              <div class="border-b border-white/[0.06] px-4 py-3">
                <p class="text-sm font-semibold text-white">Partidos finalizados</p>
                <p class="text-xs text-zinc-400">Resultados cargados en el fixture</p>
              </div>

              <ul v-if="partidosFinalizados.length > 0" class="max-h-72 overflow-y-auto py-1">
                <li v-for="partido in partidosFinalizados" :key="partido.idPartido">
                  <RouterLink
                    to="/admin/partidos"
                    class="block px-4 py-3 transition-colors hover:bg-white/5"
                    @click="cerrarPanelNotificaciones"
                  >
                    <p class="text-xs text-zinc-500">
                      Fecha {{ partido.numeroFecha }} · {{ formatearFechaPartido(partido.fechaHora) }}
                    </p>
                    <p class="mt-1 text-sm font-medium text-zinc-100">
                      {{ partido.local }}
                      <span class="tabular-nums text-yellow-400">{{ partido.golesLocal }}</span>
                      –
                      <span class="tabular-nums text-yellow-400">{{ partido.golesVisitante }}</span>
                      {{ partido.visitante }}
                    </p>
                  </RouterLink>
                </li>
              </ul>

              <p v-else class="px-4 py-6 text-center text-sm text-zinc-500">
                No hay partidos finalizados por ahora.
              </p>

              <div class="border-t border-white/[0.06] px-4 py-2">
                <RouterLink
                  to="/admin/partidos"
                  class="text-xs font-medium text-yellow-400/90 hover:text-yellow-400"
                  @click="cerrarPanelNotificaciones"
                >
                  Ir a gestión de partidos →
                </RouterLink>
              </div>
            </div>
          </div>

          <div class="hidden h-8 w-px bg-white/10 sm:block" aria-hidden="true" />

          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 font-oswald text-sm font-bold text-zinc-950"
              aria-hidden="true"
            >
              AD
            </div>
            <div class="hidden min-w-0 sm:block">
              <p class="truncate text-sm font-semibold text-white">Administrador</p>
              <p class="truncate text-xs text-zinc-400">{{ sesionAdmin?.usuario ?? '—' }}</p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              @click="salirDelPanel"
            >
              Salir
            </button>
          </div>

          <time
            class="hidden max-w-[11rem] text-right text-[11px] leading-tight text-zinc-400 capitalize lg:block"
            :datetime="new Date().toISOString()"
          >
            {{ fechaHoraTexto }}
          </time>
        </div>
      </header>

      <main class="relative z-10 flex flex-1 flex-col min-h-0">
        <div class="flex-1 p-4 sm:p-6 lg:p-8">
          <RouterView />
        </div>
      </main>

      <footer
        class="relative z-20 flex shrink-0 justify-center border-t border-white/[0.06] bg-zinc-950/95 px-6 py-3 text-xs text-zinc-600 backdrop-blur-sm sm:justify-start"
      >
        <p>© {{ anioActual }} Pro League Universitaria</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');

.font-oswald {
  font-family: 'Oswald', system-ui, sans-serif;
}
</style>
