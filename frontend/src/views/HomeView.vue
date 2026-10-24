<script setup lang="ts">
import { computed, onMounted } from 'vue'
import EscudoEquipo from '../components/EscudoEquipo.vue'
import HomeProximaFecha from '../components/home/HomeProximaFecha.vue'
import HomeTablaResumen from '../components/home/HomeTablaResumen.vue'
import HomeUltimosResultados from '../components/home/HomeUltimosResultados.vue'
import { estadioUrl } from '../assets/imagenes'
import { useDatosInicio } from '../composables/useDatosInicio'

const {
  partidoDestacado,
  proximosPartidos,
  numeroProximaFecha,
  numeroUltimaFechaJugada,
  resultadosRecientes,
  tablaResumen,
  totalEquipos,
  cargando,
  cargarDatosInicio,
} = useDatosInicio()

const tablaPosiciones = computed(() => tablaResumen.value.slice(0, 8))

const etiquetaFechaTabla = computed(() =>
  numeroUltimaFechaJugada.value != null
    ? `Fecha ${numeroUltimaFechaJugada.value}`
    : null,
)

const etiquetaResultados = computed(() => etiquetaFechaTabla.value)

onMounted(() => {
  cargarDatosInicio()
})
</script>

<template>
  <div class="bg-slate-950">
    <section
      class="relative overflow-hidden border-b border-slate-800/80 bg-slate-950 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${estadioUrl})` }"
    >
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.18),transparent_55%),linear-gradient(to_right,rgba(2,6,23,0.94),rgba(2,6,23,0.6)_50%,rgba(2,6,23,0.82))]"
        aria-hidden="true"
      />

      <div
        class="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-20"
      >
        <div class="space-y-5 sm:space-y-6">
          <div class="flex flex-wrap gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold tracking-wider text-yellow-300 uppercase"
            >
              <span aria-hidden="true">★</span>
              Pro League Universitaria
            </span>
            <span
              v-if="totalEquipos > 0"
              class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-wider text-white/80 uppercase"
            >
              {{ totalEquipos }} equipos
            </span>
            <span
              v-if="numeroUltimaFechaJugada != null"
              class="inline-flex items-center rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1 text-[10px] font-bold tracking-wider text-lime-300 uppercase"
            >
              Jornada {{ numeroUltimaFechaJugada }}
            </span>
          </div>

          <h1
            class="max-w-xl text-4xl leading-[0.95] font-black tracking-tight text-white uppercase italic sm:text-5xl lg:text-6xl"
          >
            La Liga
            <span class="block text-white/95">Universitaria</span>
          </h1>

          <p class="max-w-md text-base text-white/75 italic sm:text-lg">
            Pasión, competencia y comunidad en un solo lugar.
          </p>

          <div class="flex flex-wrap gap-3 pt-1">
            <RouterLink
              to="/tabla"
              class="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold tracking-wide text-slate-950 uppercase shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-yellow-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M6 3h12v2h1a1 1 0 0 1 1 1v2H4V6a1 1 0 0 1 1-1h1V3zm2 16H7v-2H5v4h14v-4h-2v2h-1v-5H8v5zm2-14h8V4H8v1zM6 9v8h12V9H6zm2 2h2v4H8v-4zm4 0h4v4h-4v-4z"
                />
              </svg>
              Ver tabla
            </RouterLink>
            <RouterLink
              to="/fixture"
              class="inline-flex items-center gap-2 rounded-xl border border-yellow-400/70 bg-slate-950/40 px-5 py-3 text-sm font-bold tracking-wide text-yellow-400 uppercase backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:bg-yellow-400/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm13 8H4v10h16V10zM9 12h2v2H9v-2zm4 0h2v2h-2v-2z"
                />
              </svg>
              Fixture
            </RouterLink>
            <RouterLink
              to="/equipos"
              class="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold tracking-wide text-white/90 uppercase transition-all duration-200 hover:scale-[1.02] hover:bg-white/5"
            >
              Equipos
            </RouterLink>
          </div>
        </div>

        <aside
          v-if="partidoDestacado && !cargando"
          class="rounded-2xl border border-yellow-400/35 bg-slate-900/85 p-5 shadow-sm shadow-black/40 backdrop-blur-md transition-all duration-200 hover:scale-[1.01] lg:ml-auto lg:max-w-md lg:w-full"
        >
          <p
            class="mb-5 text-center text-xs font-bold tracking-[0.2em] text-yellow-400 uppercase"
          >
            Partido destacado
          </p>

          <div class="flex items-center justify-between gap-3">
            <div class="flex flex-1 flex-col items-center gap-2 text-center">
              <EscudoEquipo
                :escudo-url="partidoDestacado.local.escudoUrl"
                :iniciales="partidoDestacado.local.iniciales"
                :color-escudo="partidoDestacado.local.colorEscudo"
                :nombre="partidoDestacado.local.nombre"
                tamano="lg"
                forma="circulo"
              />
              <span class="text-xs font-semibold text-white uppercase">
                {{ partidoDestacado.local.nombre }}
              </span>
            </div>

            <span class="text-3xl font-black tracking-tighter text-yellow-400 italic">VS</span>

            <div class="flex flex-1 flex-col items-center gap-2 text-center">
              <EscudoEquipo
                :escudo-url="partidoDestacado.visitante.escudoUrl"
                :iniciales="partidoDestacado.visitante.iniciales"
                :color-escudo="partidoDestacado.visitante.colorEscudo"
                :nombre="partidoDestacado.visitante.nombre"
                tamano="lg"
                forma="circulo"
              />
              <span class="text-xs font-semibold text-white uppercase">
                {{ partidoDestacado.visitante.nombre }}
              </span>
            </div>
          </div>

          <div
            class="mt-5 flex flex-col items-center gap-3 border-t border-slate-700/80 pt-4 text-xs font-semibold tracking-wide text-white/90 uppercase sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span class="inline-flex items-center gap-2 text-yellow-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm13 8H4v10h16V10z"
                />
              </svg>
              Fecha {{ partidoDestacado.fechaNumero }}
            </span>
            <span class="inline-flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-4 w-4 text-yellow-400"
                aria-hidden="true"
              >
                <path
                  d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 5v4.3l3.2 1.9-.9 1.5L11 13V7h2z"
                />
              </svg>
              {{ partidoDestacado.dia }} • {{ partidoDestacado.hora }}
            </span>
          </div>
        </aside>

        <div
          v-else-if="cargando"
          class="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:ml-auto lg:max-w-md lg:w-full"
          aria-hidden="true"
        >
          <div class="mx-auto mb-6 h-3 w-32 rounded bg-slate-700/80" />
          <div class="flex justify-between gap-4">
            <div class="flex flex-col items-center gap-2">
              <div class="h-14 w-14 rounded-full bg-slate-700/70" />
              <div class="h-2 w-20 rounded bg-slate-700/50" />
            </div>
            <div class="h-8 w-10 self-center rounded bg-slate-700/40" />
            <div class="flex flex-col items-center gap-2">
              <div class="h-14 w-14 rounded-full bg-slate-700/70" />
              <div class="h-2 w-20 rounded bg-slate-700/50" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div class="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <HomeProximaFecha
          :partidos="proximosPartidos"
          :cargando="cargando"
          :numero-fecha="numeroProximaFecha"
        />

        <HomeTablaResumen
          :filas="tablaPosiciones"
          :cargando="cargando"
          :total-equipos="totalEquipos"
          :etiqueta-fecha="etiquetaFechaTabla"
        />

        <HomeUltimosResultados
          :resultados="resultadosRecientes"
          :cargando="cargando"
          :etiqueta-fecha="etiquetaResultados"
        />
      </div>
    </section>
  </div>
</template>
