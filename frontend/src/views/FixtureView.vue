<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { listarEquipos } from '../api/equiposApi'
import {
  formatearFechaDia,
  formatearHora,
  mapaEquiposPorId,
  partidoConNombres,
} from '../api/mappers'
import { listarPartidos } from '../api/partidosApi'
import { estadioUrl } from '../assets/imagenes'
import FixturePartidoTarjeta, {
  type PartidoFixtureTarjeta,
} from '../components/FixturePartidoTarjeta.vue'

type FechaFixture = {
  numero: number
  partidos: PartidoFixtureTarjeta[]
}

const FECHAS_INICIALES = 3
const FECHAS_POR_LOTE = 2

const fixturePorFecha = ref<FechaFixture[]>([])
const cargando = ref(false)
const selectedFecha = ref<number>(0)
const modoCompleto = ref(false)
const fechasVisiblesCount = ref(FECHAS_INICIALES)
const sentinelRef = ref<HTMLElement | null>(null)

let observerSentinel: IntersectionObserver | null = null

const fechasDisponibles = computed(() =>
  fixturePorFecha.value.map((fecha) => fecha.numero).sort((a, b) => a - b),
)

const partidosActivos = computed(() => {
  const bloque = fixturePorFecha.value.find((f) => f.numero === selectedFecha.value)
  return bloque?.partidos ?? []
})

const fechasVisibles = computed(() =>
  fixturePorFecha.value.slice(0, fechasVisiblesCount.value),
)

const hayMasFechasPorCargar = computed(
  () => fechasVisiblesCount.value < fixturePorFecha.value.length,
)

const totalFechas = computed(() => fixturePorFecha.value.length)

function seleccionarFecha(numero: number) {
  selectedFecha.value = numero
}

function activarVistaCompleta() {
  modoCompleto.value = true
  fechasVisiblesCount.value = Math.min(FECHAS_INICIALES, fixturePorFecha.value.length)
  void nextTick(() => {
    configurarObserverSentinel()
    document.getElementById('fixture-vista-completa')?.scrollIntoView({ behavior: 'smooth' })
  })
}

function volverVistaPorFecha() {
  modoCompleto.value = false
  observerSentinel?.disconnect()
  observerSentinel = null
}

function cargarMasFechasVisibles() {
  if (!hayMasFechasPorCargar.value) return
  fechasVisiblesCount.value = Math.min(
    fechasVisiblesCount.value + FECHAS_POR_LOTE,
    fixturePorFecha.value.length,
  )
}

function configurarObserverSentinel() {
  observerSentinel?.disconnect()
  if (!modoCompleto.value || !sentinelRef.value) return

  observerSentinel = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        cargarMasFechasVisibles()
      }
    },
    { rootMargin: '240px 0px' },
  )
  observerSentinel.observe(sentinelRef.value)
}

watch(fechasVisiblesCount, () => {
  void nextTick(() => configurarObserverSentinel())
})

async function cargarFixture() {
  cargando.value = true
  try {
    const [equipos, partidos] = await Promise.all([listarEquipos(), listarPartidos()])
    const mapa = mapaEquiposPorId(equipos)
    const porFecha = new Map<number, PartidoFixtureTarjeta[]>()

    for (const partido of partidos) {
      const numero = partido.numero_fecha ?? 0
      const { local, visitante } = partidoConNombres(partido, mapa)
      const item: PartidoFixtureTarjeta = {
        id: partido.id,
        fechaDia: formatearFechaDia(partido.fecha_hora),
        hora: formatearHora(partido.fecha_hora),
        cancha: 'Cancha 1',
        local: {
          nombre: local.nombre,
          iniciales: local.iniciales,
          colorEscudo: local.colorEscudo,
          escudoUrl: local.escudoUrl,
        },
        visitante: {
          nombre: visitante.nombre,
          iniciales: visitante.iniciales,
          colorEscudo: visitante.colorEscudo,
          escudoUrl: visitante.escudoUrl,
        },
      }
      const lista = porFecha.get(numero) ?? []
      lista.push(item)
      porFecha.set(numero, lista)
    }

    fixturePorFecha.value = [...porFecha.entries()]
      .sort(([a], [b]) => a - b)
      .map(([numero, lista]) => ({
        numero,
        partidos: lista.sort((a, b) => {
          const partidoA = partidos.find((p) => p.id === a.id)
          const partidoB = partidos.find((p) => p.id === b.id)
          const ordenA = partidoA?.numero_partido ?? Number.MAX_SAFE_INTEGER
          const ordenB = partidoB?.numero_partido ?? Number.MAX_SAFE_INTEGER
          if (ordenA !== ordenB) return ordenA - ordenB
          return a.id - b.id
        }),
      }))

    selectedFecha.value = fixturePorFecha.value[0]?.numero ?? 0
    fechasVisiblesCount.value = Math.min(FECHAS_INICIALES, fixturePorFecha.value.length)
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarFixture()
})

onUnmounted(() => {
  observerSentinel?.disconnect()
})
</script>

<template>
  <div class="bg-zinc-950 text-white">
    <section
      class="relative overflow-hidden border-b border-zinc-800 bg-zinc-950 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${estadioUrl})` }"
    >
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.2),transparent_55%),linear-gradient(to_bottom,rgba(9,9,11,0.55),rgba(9,9,11,0.92))]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -left-8 top-8 h-24 w-48 rotate-[-8deg] rounded-full bg-yellow-500/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-4 bottom-0 h-20 w-40 rotate-[12deg] rounded-full bg-yellow-400/20 blur-2xl"
        aria-hidden="true"
      />

      <div class="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <h1
          class="titulo-pincel font-oswald text-5xl font-black uppercase italic tracking-tight text-yellow-400 sm:text-6xl md:text-7xl"
        >
          Fixture
        </h1>
        <p
          class="mt-1 font-oswald text-base font-medium uppercase italic tracking-[0.18em] text-sky-300/90 sm:text-lg sm:tracking-[0.28em] md:text-xl md:tracking-[0.35em]"
        >
          Partidos del torneo
        </p>
      </div>
    </section>

    <section class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <p v-if="cargando" class="text-center text-sm text-zinc-400">Cargando fixture...</p>

      <template v-else>
        <div
          v-if="!modoCompleto"
          class="-mx-1 flex gap-2 overflow-x-auto pb-2 scrollbar-thin sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-3"
          role="tablist"
          aria-label="Seleccionar fecha del torneo"
        >
          <button
            v-for="numero in fechasDisponibles"
            :key="numero"
            type="button"
            role="tab"
            :aria-selected="selectedFecha === numero"
            class="shrink-0 rounded-md border px-5 py-2.5 font-oswald text-sm font-bold uppercase tracking-wider transition-colors sm:px-8 sm:text-base"
            :class="
              selectedFecha === numero
                ? 'border-yellow-400 bg-yellow-400 text-black shadow-[0_0_24px_rgba(250,204,21,0.35)]'
                : 'border-zinc-700 bg-zinc-900/60 text-white hover:border-zinc-500 hover:bg-zinc-800/80'
            "
            @click="seleccionarFecha(numero)"
          >
            Fecha {{ numero }}
          </button>
        </div>

        <p
          v-if="modoCompleto"
          class="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-center text-sm text-zinc-300"
        >
          Mostrando
          <strong class="text-yellow-400">{{ fechasVisibles.length }}</strong>
          de
          <strong class="text-white">{{ totalFechas }}</strong>
          fechas. Bajá para cargar más jornadas.
        </p>

        <p
          v-if="!modoCompleto && partidosActivos.length === 0"
          class="mt-8 text-center text-sm text-zinc-500"
        >
          No hay partidos cargados para esta fecha.
        </p>

        <ul v-else-if="!modoCompleto" class="mt-8 space-y-3 sm:space-y-4" role="list">
          <li v-for="partido in partidosActivos" :key="partido.id">
            <FixturePartidoTarjeta :partido="partido" />
          </li>
        </ul>

        <div
          v-else
          id="fixture-vista-completa"
          class="mt-8 space-y-10"
        >
          <section
            v-for="bloque in fechasVisibles"
            :key="bloque.numero"
            class="scroll-mt-24"
            :aria-labelledby="`titulo-fecha-${bloque.numero}`"
          >
            <h2
              :id="`titulo-fecha-${bloque.numero}`"
              class="mb-4 border-b border-yellow-500/30 pb-2 font-oswald text-xl font-bold uppercase tracking-wide text-yellow-400 sm:text-2xl"
            >
              Fecha {{ bloque.numero }}
            </h2>
            <ul class="space-y-3 sm:space-y-4" role="list">
              <li v-for="partido in bloque.partidos" :key="partido.id">
                <FixturePartidoTarjeta :partido="partido" />
              </li>
            </ul>
          </section>

          <div ref="sentinelRef" class="h-2 w-full" aria-hidden="true" />

          <p
            v-if="hayMasFechasPorCargar"
            class="py-4 text-center text-sm text-zinc-500"
          >
            Cargando más fechas…
          </p>
          <p
            v-else-if="totalFechas > 0"
            class="py-4 text-center text-xs font-medium tracking-wide text-zinc-600 uppercase"
          >
            Fin del fixture
          </p>
        </div>

        <div class="mt-10 flex justify-center pb-6">
          <button
            type="button"
            class="inline-flex w-full max-w-2xl items-center justify-center gap-2 rounded-md border-2 border-yellow-500 bg-transparent px-4 py-3.5 font-oswald text-xs font-bold uppercase tracking-[0.12em] text-yellow-500 transition-colors hover:bg-yellow-500/10 hover:text-yellow-400 sm:gap-3 sm:px-6 sm:py-4 sm:text-sm sm:tracking-[0.2em] md:text-base"
            @click="modoCompleto ? volverVistaPorFecha() : activarVistaCompleta()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path
                d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm13 8H4v10h16V10zM9 12h2v2H9v-2zm4 0h2v2h-2v-2z"
              />
            </svg>
            {{ modoCompleto ? 'Ver por fecha' : 'Ver todo el fixture' }}
          </button>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');

.font-oswald {
  font-family: 'Oswald', system-ui, sans-serif;
}

.titulo-pincel {
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.5),
    0 0 40px rgba(250, 204, 21, 0.35);
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.4));
}
</style>
