<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { estadioUrl } from '../assets/imagenes'
import TablaRegularPanel from '../components/tabla/TablaRegularPanel.vue'
import TablaPlayoffsPanel from '../components/tabla/TablaPlayoffsPanel.vue'
import { POSICIONES_PLAYOFF } from '../components/home/homeTablaZonas'
import { useTablaPosiciones } from '../composables/useTablaPosiciones'

const faseSeleccionada = ref<'regular' | 'playoffs'>('regular')

const { filas, cargando, error, cargarTabla } = useTablaPosiciones()
const equiposTabla = computed(() => filas.value)
const cantidadEquipos = computed(() => filas.value.length)

const liderNombre = computed(() => filas.value[0]?.equipo.nombre ?? null)

onMounted(() => {
  cargarTabla()
})

function seleccionarFase(fase: 'regular' | 'playoffs') {
  faseSeleccionada.value = fase
}
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
        <div class="flex flex-wrap gap-2">
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
            class="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-200 uppercase"
          >
            Top {{ POSICIONES_PLAYOFF }} a playoffs
          </span>
          <span
            v-if="liderNombre"
            class="inline-flex max-w-[14rem] items-center truncate rounded-full border border-yellow-400/20 bg-yellow-400/5 px-3 py-1 text-[10px] font-bold tracking-wider text-yellow-200 uppercase"
          >
            Líder: {{ liderNombre }}
          </span>
        </div>

        <h1
          class="titulo-pincel mt-4 font-oswald text-4xl font-black uppercase italic tracking-tight text-yellow-400 sm:text-5xl md:text-6xl"
        >
          Tabla de posiciones
        </h1>

        <div
          class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p
            class="max-w-md text-sm text-slate-400 sm:text-base"
          >
            Clasificación actual del torneo. En mobile podés ver cada equipo en tarjetas; en
            pantallas grandes, la tabla completa.
          </p>

          <div
            class="inline-flex w-full shrink-0 rounded-xl border border-slate-700/80 bg-slate-900/70 p-1 sm:w-auto"
            role="tablist"
            aria-label="Fase del torneo"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="faseSeleccionada === 'regular'"
              class="flex-1 rounded-lg px-4 py-2.5 font-oswald text-xs font-bold uppercase tracking-wider transition-all duration-200 sm:flex-none sm:px-6 sm:text-sm"
              :class="
                faseSeleccionada === 'regular'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              "
              @click="seleccionarFase('regular')"
            >
              Fase regular
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="faseSeleccionada === 'playoffs'"
              class="flex-1 rounded-lg px-4 py-2.5 font-oswald text-xs font-bold uppercase tracking-wider transition-all duration-200 sm:flex-none sm:px-6 sm:text-sm"
              :class="
                faseSeleccionada === 'playoffs'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              "
              @click="seleccionarFase('playoffs')"
            >
              Playoffs
            </button>
          </div>
        </div>
      </header>

      <TablaRegularPanel
        v-if="faseSeleccionada === 'regular'"
        :filas="equiposTabla"
        :cargando="cargando"
        :error="error"
      />

      <TablaPlayoffsPanel v-else />
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
