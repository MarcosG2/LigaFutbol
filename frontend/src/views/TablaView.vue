<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { estadioUrl } from '../assets/imagenes'
import EscudoEquipo from '../components/EscudoEquipo.vue'
import { useTablaPosiciones } from '../composables/useTablaPosiciones'

const POSICIONES_PLAYOFF = 6

const faseSeleccionada = ref('regular')
const faseHabilitada = ref(true)

const octavos = Array.from({ length: 8 }, (_, i) => i + 1)
const cuartos = Array.from({ length: 4 }, (_, i) => i + 1)
const semis = Array.from({ length: 2 }, (_, i) => i + 1)

const { filas, cargarTabla } = useTablaPosiciones()
const equiposTabla = computed(() => filas.value)

onMounted(() => {
  cargarTabla()
})

function clasesPosicion(posicion: number): string {
  if (posicion <= POSICIONES_PLAYOFF) {
    return 'bg-green-600/20 text-green-400'
  }
  return 'bg-red-600/20 text-red-400'
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
      class="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-black/70 via-black/80 to-zinc-950/95"
      aria-hidden="true"
    />

    <section class="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <header class="mb-8">
        <h1
          class="titulo-pincel font-oswald text-4xl font-black uppercase italic tracking-tight text-yellow-400 sm:text-5xl md:text-6xl"
        >
          Tabla de posiciones
        </h1>

        <div
          class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p
            class="font-oswald text-base font-medium uppercase italic tracking-[0.12em] text-white/90 sm:text-lg sm:tracking-[0.25em]"
          >
            Pro League Universitaria
          </p>

          <div class="relative w-full sm:w-auto sm:min-w-[220px]">
            <label for="fase-torneo" class="sr-only">Fase del torneo</label>
            <select
              id="fase-torneo"
              v-model="faseSeleccionada"
              class="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-900/90 py-2.5 pl-4 pr-10 font-oswald text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:border-zinc-600 focus:border-yellow-500/60 focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
            >
              <option value="regular">FASE REGULAR</option>
              <option value="playoffs">PLAYOFFS</option>
            </select>
            <span
              class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500"
              aria-hidden="true"
            >
              ▾
            </span>
          </div>
        </div>
      </header>

      <!-- Fase regular -->
      <template v-if="faseSeleccionada === 'regular'">
        <div
          class="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 shadow-lg shadow-black/20 backdrop-blur-sm"
        >
          <p class="px-4 pt-3 text-center text-[11px] text-zinc-500 sm:hidden">
            Deslizá horizontalmente para ver todas las columnas
          </p>
          <div class="overflow-x-auto overscroll-x-contain">
            <table class="w-full min-w-0 text-sm sm:min-w-[640px]">
              <thead>
                <tr
                  class="border-b border-zinc-800 text-left text-xs font-semibold uppercase tracking-wider text-sky-300/70"
                >
                  <th class="w-10 px-2 py-3 sm:w-12 sm:px-4">#</th>
                  <th class="min-w-[8.5rem] px-2 py-3 sm:min-w-0 sm:px-3">Equipo</th>
                  <th class="px-2 py-3 text-center">PJ</th>
                  <th class="hidden px-2 py-3 text-center sm:table-cell">PG</th>
                  <th class="hidden px-2 py-3 text-center sm:table-cell">PE</th>
                  <th class="hidden px-2 py-3 text-center md:table-cell">PP</th>
                  <th class="hidden px-2 py-3 text-center lg:table-cell">GF</th>
                  <th class="hidden px-2 py-3 text-center lg:table-cell">GC</th>
                  <th class="px-2 py-3 text-center sm:px-3">PTS</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="fila in equiposTabla"
                  :key="fila.equipo_id"
                  class="border-b border-zinc-800 transition-colors last:border-b-0 hover:bg-zinc-800/50"
                >
                  <td class="px-2 py-3 sm:px-4">
                    <span
                      class="inline-flex h-7 min-w-7 items-center justify-center rounded px-1 text-xs font-bold tabular-nums"
                      :class="clasesPosicion(fila.posicion)"
                    >
                      {{ fila.posicion }}
                    </span>
                  </td>
                  <td class="px-2 py-3 sm:px-3">
                    <div class="flex items-center gap-2 sm:gap-3">
                      <EscudoEquipo
                        :escudo-url="fila.equipo.escudoUrl"
                        :iniciales="fila.equipo.iniciales"
                        :color-escudo="fila.equipo.colorEscudo"
                        :nombre="fila.equipo.nombre"
                        tamano="md"
                        forma="circulo"
                      />
                      <span class="max-w-[9rem] truncate font-medium text-white sm:max-w-none">
                        {{ fila.equipo.nombre }}
                      </span>
                    </div>
                  </td>
                  <td class="px-2 py-3 text-center tabular-nums text-zinc-300">
                    {{ fila.pj }}
                  </td>
                  <td class="hidden px-2 py-3 text-center tabular-nums text-zinc-300 sm:table-cell">
                    {{ fila.pg }}
                  </td>
                  <td class="hidden px-2 py-3 text-center tabular-nums text-zinc-300 sm:table-cell">
                    {{ fila.pe }}
                  </td>
                  <td class="hidden px-2 py-3 text-center tabular-nums text-zinc-300 md:table-cell">
                    {{ fila.pp }}
                  </td>
                  <td class="hidden px-2 py-3 text-center tabular-nums text-zinc-300 lg:table-cell">
                    {{ fila.gf }}
                  </td>
                  <td class="hidden px-2 py-3 text-center tabular-nums text-zinc-300 lg:table-cell">
                    {{ fila.gc }}
                  </td>
                  <td class="px-2 py-3 text-center sm:px-3">
                    <span class="text-base font-bold tabular-nums text-lime-400">{{ fila.pts }}</span>
                    <span
                      v-if="fila.puntos_descontados > 0"
                      class="mt-0.5 block text-[10px] font-semibold text-red-400/90"
                    >
                      −{{ fila.puntos_descontados }}
                      {{ fila.puntos_descontados === 1 ? 'pt. descontado' : 'pts. descontados' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer class="mt-6 flex flex-wrap items-center gap-6 text-sm text-zinc-400">
          <div class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500"
              aria-hidden="true"
            />
            <span>Clasificación a playoffs</span>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
              aria-hidden="true"
            />
            <span>Zona de descenso</span>
          </div>
        </footer>
      </template>

      <!-- Playoffs -->
      <div
        v-else
        class="relative overflow-hidden rounded-xl border border-zinc-700/40 bg-transparent p-3 sm:p-5"
      >
        <div
          class="overflow-x-auto transition-opacity duration-300"
          :class="faseHabilitada ? 'opacity-100' : 'opacity-50'"
        >
          <div
            class="flex h-[920px] min-h-[920px] w-full min-w-[52rem] flex-row gap-12"
          >
            <!-- Octavos -->
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
                    class="bracket-partido w-full shrink-0 border border-zinc-700/50 bg-zinc-900/70 backdrop-blur-sm"
                  >
                    <div class="bracket-slot">Equipo —</div>
                    <div class="bracket-slot">Equipo —</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cuartos -->
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
                    class="bracket-partido w-full shrink-0 border border-zinc-700/50 bg-zinc-900/70 backdrop-blur-sm"
                  >
                    <div class="bracket-slot">Equipo —</div>
                    <div class="bracket-slot">Equipo —</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Semis -->
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
                    class="bracket-partido w-full shrink-0 border border-zinc-700/50 bg-zinc-900/70 backdrop-blur-sm"
                  >
                    <div class="bracket-slot">Equipo —</div>
                    <div class="bracket-slot">Equipo —</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Final -->
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
                    class="bracket-partido bracket-partido--final w-full max-w-[11rem] shrink-0 border border-zinc-700/50 bg-zinc-900/70 backdrop-blur-sm ring-1 ring-yellow-500/25"
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
          class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60 px-6 backdrop-blur-md"
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
  border-radius: 0.5rem;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
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
