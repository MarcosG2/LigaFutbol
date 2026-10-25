<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { mapaEquiposPorId } from '../../api/mappers'
import { listarEquipos } from '../../api/equiposApi'
import { listarPartidos } from '../../api/partidosApi'
import EscudoEquipo from '../EscudoEquipo.vue'
import { construirCuadroPlayoffs } from '../../utils/cuadroPlayoffs'

const cargando = ref(true)
const error = ref('')
const rondas = ref<ReturnType<typeof construirCuadroPlayoffs>['rondas']>([])
const hayPlayoffs = ref(false)

const alturaMinima = computed(() => {
  const partidosPrimera = rondas.value[0]?.partidos.length ?? 1
  return Math.max(420, partidosPrimera * 100 + 48)
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [partidos, equipos] = await Promise.all([listarPartidos(), listarEquipos()])
    const equiposPorId = mapaEquiposPorId(equipos)
    const resultado = construirCuadroPlayoffs(partidos, equiposPorId)
    rondas.value = resultado.rondas
    hayPlayoffs.value = resultado.hayPlayoffs
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar el cuadro de playoffs.'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargar()
})

defineExpose({ recargar: cargar })

/** Cada partido de la ronda r ocupa el doble de alto que uno de la ronda anterior. */
function flexDeRonda(indiceRonda: number): number {
  return 2 ** indiceRonda
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3 shadow-sm backdrop-blur-sm sm:p-5"
  >
    <p v-if="cargando" class="py-16 text-center text-sm text-slate-400">Cargando cuadro de playoffs…</p>
    <p v-else-if="error" class="py-12 text-center text-sm text-red-300">{{ error }}</p>
    <p
      v-else-if="!hayPlayoffs"
      class="py-16 text-center text-sm text-slate-400"
    >
      Todavía no hay fechas de playoffs cargadas en el fixture. El administrador puede generarlas desde
      Gestión del fixture.
    </p>

    <template v-else>
      <p class="mb-3 text-center text-[11px] text-slate-500 sm:hidden">
        Deslizá horizontalmente para ver el cuadro completo
      </p>
      <div class="bracket-scroll overflow-x-auto overscroll-x-contain px-1 pb-2">
        <div
          class="bracket-canvas mx-auto flex w-max flex-row items-stretch"
          :style="{ minHeight: `${alturaMinima}px`, height: `${alturaMinima}px` }"
        >
          <template v-for="(ronda, indiceRonda) in rondas" :key="ronda.titulo + indiceRonda">
            <div class="bracket-column flex h-full w-52 shrink-0 flex-col">
              <h2
                class="mb-3 h-5 shrink-0 text-center text-xs font-bold uppercase tracking-[0.2em]"
                :class="ronda.titulo === 'Final' ? 'text-yellow-400/90' : 'text-sky-300/90'"
              >
                {{ ronda.titulo }}
              </h2>
              <div class="bracket-ronda flex min-h-0 flex-1 flex-col">
                <div
                  v-for="(partido, indicePartido) in ronda.partidos"
                  :key="`${indiceRonda}-${indicePartido}`"
                  class="flex min-h-0 items-center"
                  :style="{ flex: flexDeRonda(indiceRonda) }"
                >
                  <div
                    class="bracket-partido w-full border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm"
                    :class="ronda.titulo === 'Final' ? 'ring-1 ring-yellow-500/25' : ''"
                  >
                    <div
                      v-for="(slot, indiceSlot) in [partido.local, partido.visitante]"
                      :key="indiceSlot"
                      class="bracket-slot"
                      :class="{
                        'bracket-slot--ganador': slot.esGanador,
                        'bracket-slot--vacio': !slot.equipoId,
                      }"
                    >
                      <template v-if="slot.equipoId">
                        <EscudoEquipo
                          :escudo-url="slot.escudoUrl"
                          :iniciales="slot.iniciales"
                          :color-escudo="slot.colorEscudo"
                          :nombre="slot.nombre"
                          tamano="sm"
                          forma="circulo"
                        />
                        <span class="bracket-slot-nombre min-w-0 flex-1 truncate" :title="slot.nombre">
                          {{ slot.nombre }}
                        </span>
                      </template>
                      <span v-else class="w-full text-center tracking-widest text-slate-600">—</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="indiceRonda < rondas.length - 1"
              :key="`puente-${indiceRonda}`"
              class="bracket-puente flex w-14 shrink-0 flex-col"
              aria-hidden="true"
            >
              <div class="mb-3 h-5 shrink-0" aria-hidden="true" />
              <div class="flex min-h-0 flex-1 flex-col">
                <div
                  v-for="(_, indicePuente) in rondas[indiceRonda + 1].partidos"
                  :key="indicePuente"
                  class="relative min-h-0"
                  :style="{ flex: flexDeRonda(indiceRonda + 1) }"
                >
                  <svg
                    class="bracket-puente-svg absolute inset-0 h-full w-full text-zinc-500"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 100"
                  >
                    <path
                      d="M 0 25 H 50 V 75 M 0 75 H 50 M 50 50 H 100"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      vector-effect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bracket-scroll {
  overflow-y: visible;
}

.bracket-partido {
  position: relative;
  z-index: 1;
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
  min-height: 2.75rem;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  border-bottom: 1px solid rgb(63 63 70 / 0.45);
  padding: 0.45rem 0.65rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(212 212 216);
}

.bracket-slot-nombre {
  line-height: 1.2;
}

.bracket-slot--vacio {
  justify-content: center;
  color: rgb(113 113 122);
}

.bracket-slot--ganador {
  color: rgb(254 240 138);
  background: linear-gradient(90deg, rgb(250 204 21 / 0.14), rgb(250 204 21 / 0.04));
  box-shadow: inset 3px 0 0 rgb(250 204 21 / 0.85);
}

.bracket-slot--ganador .bracket-slot-nombre {
  color: rgb(250 204 21);
}

.bracket-partido .bracket-slot:last-child {
  border-bottom: none;
}

.bracket-puente-svg {
  overflow: visible;
  pointer-events: none;
}
</style>
