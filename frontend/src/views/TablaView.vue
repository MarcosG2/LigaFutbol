<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { estadioUrl } from '../assets/imagenes'
import TablaRegularPanel from '../components/tabla/TablaRegularPanel.vue'
import { POSICIONES_PLAYOFF } from '../components/home/homeTablaZonas'
import { useTablaPosiciones } from '../composables/useTablaPosiciones'

const faseSeleccionada = ref<'regular' | 'playoffs'>('regular')
const faseHabilitada = ref(true)

const octavos = Array.from({ length: 8 }, (_, i) => i + 1)
const cuartos = Array.from({ length: 4 }, (_, i) => i + 1)
const semis = Array.from({ length: 2 }, (_, i) => i + 1)

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

      <div
        v-else
        class="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3 shadow-sm backdrop-blur-sm sm:p-5"
      >
        <p class="mb-3 text-center text-[11px] text-slate-500 sm:hidden">
          Deslizá horizontalmente para ver el cuadro completo
        </p>
        <div
          class="overflow-x-auto overscroll-x-contain transition-opacity duration-300"
          :class="faseHabilitada ? 'opacity-100' : 'opacity-50'"
        >
          <div
            class="flex h-[920px] min-h-[920px] w-full min-w-[52rem] flex-row gap-12"
          >
            <div class="flex h-full min-h-0 w-1/4 flex-col">
              <h2
                class="mb-3 shrink-0 text-center text-xs font-bold uppercase tracking-[0.2em] text-sky-300/90"
              >
                Octavos
              </h2>
              <div class="bracket-ronda flex min-h-0 flex-1 flex-col">
                <div
                  v-for="n in octavos"
                  :key="`oct-${n}`"
                  class="bracket-ronda-celda flex min-h-0 flex-1 items-center justify-center py-1"
                >
                  <div
                    class="bracket-partido w-full shrink-0 border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm"
                  >
                    <div class="bracket-slot">Equipo —</div>
                    <div class="bracket-slot">Equipo —</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex h-full min-h-0 w-1/4 flex-col">
              <h2
                class="mb-3 shrink-0 text-center text-xs font-bold uppercase tracking-[0.2em] text-sky-300/90"
              >
                Cuartos
              </h2>
              <div class="bracket-ronda flex min-h-0 flex-1 flex-col">
                <div
                  v-for="n in cuartos"
                  :key="`cua-${n}`"
                  class="bracket-ronda-celda flex min-h-0 flex-1 items-center justify-center py-1"
                >
                  <div
                    class="bracket-partido w-full shrink-0 border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm"
                  >
                    <div class="bracket-slot">Equipo —</div>
                    <div class="bracket-slot">Equipo —</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex h-full min-h-0 w-1/4 flex-col">
              <h2
                class="mb-3 shrink-0 text-center text-xs font-bold uppercase tracking-[0.2em] text-sky-300/90"
              >
                Semis
              </h2>
              <div class="bracket-ronda flex min-h-0 flex-1 flex-col">
                <div
                  v-for="n in semis"
                  :key="`sem-${n}`"
                  class="bracket-ronda-celda flex min-h-0 flex-1 items-center justify-center py-1"
                >
                  <div
                    class="bracket-partido w-full shrink-0 border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm"
                  >
                    <div class="bracket-slot">Equipo —</div>
                    <div class="bracket-slot">Equipo —</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex h-full min-h-0 w-1/4 flex-col">
              <h2
                class="mb-3 shrink-0 text-center text-xs font-bold uppercase tracking-[0.2em] text-yellow-400/90"
              >
                Final
              </h2>
              <div class="bracket-ronda flex min-h-0 flex-1 flex-col">
                <div
                  class="bracket-ronda-celda flex min-h-0 flex-1 items-center justify-center py-1"
                >
                  <div
                    class="bracket-partido bracket-partido--final w-full max-w-[11rem] shrink-0 border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm ring-1 ring-yellow-500/25"
                  >
                    <div class="bracket-slot">Equipo —</div>
                    <div class="bracket-slot">Equipo —</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="!faseHabilitada"
          class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/60 px-6 backdrop-blur-md"
        >
          <div class="max-w-md text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="mx-auto h-14 w-14 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.45)]"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3A5.25 5.25 0 0 0 12 1.5Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                clip-rule="evenodd"
              />
            </svg>
            <p
              class="mt-5 font-oswald text-base font-bold uppercase leading-relaxed tracking-wide text-white sm:text-lg"
            >
              Fase de playoffs bloqueada. Disponible al finalizar la fase regular
            </p>
          </div>
        </div>
      </div>
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

.bracket-partido {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.bracket-partido:hover {
  border-color: rgb(250 204 21 / 0.25);
}

.bracket-slot {
  display: flex;
  min-height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgb(63 63 70 / 0.45);
  padding: 0.5rem 0.75rem;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(161 161 170);
}

.bracket-partido .bracket-slot:last-child {
  border-bottom: none;
}

.bracket-partido::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -1rem;
  width: 1rem;
  height: 1px;
  background: rgb(82 82 91 / 0.85);
  transform: translateY(-50%);
}

.bracket-partido--final::after {
  display: none;
}
</style>
