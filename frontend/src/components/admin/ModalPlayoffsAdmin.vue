<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  generarEtapaPlayoffs,
  type ClasificadoPlayoffApi,
  type CruceGeneradoApi,
} from '../../api/fixtureApi'
import { obtenerTablaTorneo, obtenerTorneoActivo } from '../../api/torneosApi'
import { POSICIONES_PLAYOFF } from '../home/homeTablaZonas'

const props = defineProps<{
  abierto: boolean
  equipos: { id: number; nombre: string }[]
}>()

const emit = defineEmits<{
  cerrar: []
  aplicar: [
    payload: {
      numeroFecha: number
      cruces: CruceGeneradoApi[]
    },
  ]
}>()

const cantidadClasificados = ref(POSICIONES_PLAYOFF)
const formato = ref<'estandar' | 'aleatorio'>('estandar')
const clasificados = ref<ClasificadoPlayoffApi[]>([])
const cruces = ref<CruceGeneradoApi[]>([])
const numeroFecha = ref(1)
const cargando = ref(false)
const error = ref('')

const opcionesCantidad = [4, 6, 8, 16]

const equiposTabla = ref<{ id: number; nombre: string; pts: number; posicion: number }[]>([])

const equiposParaSelect = computed(() => {
  const mapa = new Map<number, string>()
  for (const equipo of props.equipos) mapa.set(equipo.id, equipo.nombre)
  for (const equipo of equiposTabla.value) mapa.set(equipo.id, equipo.nombre)
  return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }))
})

async function cargarPropuesta() {
  error.value = ''
  cargando.value = true
  try {
    const torneo = await obtenerTorneoActivo()
    if (!torneo) {
      error.value = 'No hay torneo activo.'
      return
    }

    const tabla = await obtenerTablaTorneo(torneo.id)
    equiposTabla.value = tabla.map((fila, indice) => ({
      id: fila.equipo_id,
      nombre: fila.nombre,
      pts: fila.pts,
      posicion: indice + 1,
    }))

    const resultado = await generarEtapaPlayoffs({
      torneo_id: torneo.id,
      cantidad_clasificados: cantidadClasificados.value,
      formato: formato.value,
      clasificados_ids:
        clasificados.value.length === cantidadClasificados.value
          ? clasificados.value.map((c) => c.equipo_id)
          : undefined,
    })

    clasificados.value = resultado.clasificados
    cruces.value = resultado.cruces
    numeroFecha.value = resultado.numero_fecha_sugerido
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo generar el cuadro de playoffs.'
  } finally {
    cargando.value = false
  }
}

function reemplazarClasificado(indice: number, equipoId: number) {
  const equipo = equiposParaSelect.value.find((e) => e.id === equipoId)
  if (!equipo) return
  const filaTabla = equiposTabla.value.find((e) => e.id === equipoId)
  clasificados.value[indice] = {
    ...clasificados.value[indice],
    equipo_id: equipoId,
    nombre: equipo.nombre,
    posicion: filaTabla?.posicion ?? clasificados.value[indice]?.posicion ?? indice + 1,
    pts: filaTabla?.pts ?? 0,
  }
}

function actualizarCruceLocal(indice: number, equipoId: number) {
  const cruce = cruces.value[indice]
  if (!cruce) return
  cruces.value[indice] = { ...cruce, equipo_local_id: equipoId }
}

function actualizarCruceVisitante(indice: number, equipoId: number) {
  const cruce = cruces.value[indice]
  if (!cruce) return
  cruces.value[indice] = { ...cruce, equipo_visitante_id: equipoId }
}

function confirmarAplicar() {
  if (cruces.value.length === 0) {
    error.value = 'Generá o revisá los cruces antes de aplicar.'
    return
  }
  emit('aplicar', {
    numeroFecha: numeroFecha.value,
    cruces: cruces.value.map((c, i) => ({
      ...c,
      numero_partido: c.numero_partido ?? i + 1,
    })),
  })
}

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return
    clasificados.value = []
    cruces.value = []
    error.value = ''
    cantidadClasificados.value = POSICIONES_PLAYOFF
    formato.value = 'estandar'
    cargarPropuesta()
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="abierto"
      class="fixed inset-0 z-[55] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-playoffs"
    >
      <div
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
        @click="emit('cerrar')"
      />

      <div
        class="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        <header class="shrink-0 border-b border-zinc-800/80 px-5 py-4 sm:px-6">
          <h3 id="titulo-modal-playoffs" class="text-lg font-semibold text-white">
            Generar fase de playoffs
          </h3>
          <p class="mt-1 text-sm text-zinc-400">
            Revisá clasificados y cruces. Podés reemplazar equipos antes de crear la fecha.
          </p>
        </header>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          <div class="flex flex-wrap gap-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-zinc-400">Clasificados</label>
              <select
                v-model.number="cantidadClasificados"
                class="rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white"
                :disabled="cargando"
              >
                <option v-for="n in opcionesCantidad" :key="n" :value="n">{{ n }} equipos</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-zinc-400">Formato de cruces</label>
              <select
                v-model="formato"
                class="rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white"
                :disabled="cargando"
              >
                <option value="estandar">Estándar (1° vs último, …)</option>
                <option value="aleatorio">Aleatorio en el bombo</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-zinc-400">Nº de fecha</label>
              <input
                v-model.number="numeroFecha"
                type="number"
                min="1"
                class="w-24 rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white tabular-nums"
                :disabled="cargando"
              />
            </div>
            <button
              type="button"
              class="self-end rounded-xl border border-yellow-500/40 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50"
              :disabled="cargando"
              @click="cargarPropuesta"
            >
              {{ cargando ? 'Calculando…' : 'Recalcular cuadro' }}
            </button>
          </div>

          <p v-if="error" class="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {{ error }}
          </p>

          <section v-if="clasificados.length > 0">
            <h4 class="mb-2 text-sm font-semibold uppercase tracking-wide text-yellow-400">
              Clasificados
            </h4>
            <ul class="space-y-2">
              <li
                v-for="(item, indice) in clasificados"
                :key="`clas-${indice}`"
                class="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2"
              >
                <span class="w-8 text-xs font-bold text-zinc-500 tabular-nums">
                  {{ item.posicion }}°
                </span>
                <select
                  class="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-white"
                  :value="item.equipo_id"
                  @change="
                    reemplazarClasificado(
                      indice,
                      Number(($event.target as HTMLSelectElement).value),
                    )
                  "
                >
                  <option
                    v-for="equipo in equiposParaSelect"
                    :key="`cl-${indice}-${equipo.id}`"
                    :value="equipo.id"
                  >
                    {{ equipo.nombre }}
                  </option>
                </select>
                <span class="text-xs text-zinc-500 tabular-nums">{{ item.pts }} pts</span>
              </li>
            </ul>
          </section>

          <section v-if="cruces.length > 0">
            <h4 class="mb-2 text-sm font-semibold uppercase tracking-wide text-yellow-400">
              Cruces (editable)
            </h4>
            <ul class="space-y-3">
              <li
                v-for="(cruce, indice) in cruces"
                :key="`cruce-${indice}`"
                class="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3"
              >
                <p class="mb-2 text-xs font-medium text-zinc-500">Partido {{ indice + 1 }}</p>
                <div class="grid gap-2 sm:grid-cols-2">
                  <select
                    class="rounded-xl border border-zinc-700 bg-zinc-950/60 px-2 py-2 text-sm text-white"
                    :value="cruce.equipo_local_id"
                    @change="
                      actualizarCruceLocal(
                        indice,
                        Number(($event.target as HTMLSelectElement).value),
                      )
                    "
                  >
                    <option
                      v-for="equipo in equiposParaSelect"
                      :key="`loc-${indice}-${equipo.id}`"
                      :value="equipo.id"
                    >
                      {{ equipo.nombre }}
                    </option>
                  </select>
                  <select
                    class="rounded-xl border border-zinc-700 bg-zinc-950/60 px-2 py-2 text-sm text-white"
                    :value="cruce.equipo_visitante_id"
                    @change="
                      actualizarCruceVisitante(
                        indice,
                        Number(($event.target as HTMLSelectElement).value),
                      )
                    "
                  >
                    <option
                      v-for="equipo in equiposParaSelect"
                      :key="`vis-${indice}-${equipo.id}`"
                      :value="equipo.id"
                    >
                      {{ equipo.nombre }}
                    </option>
                  </select>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <footer
          class="sticky bottom-0 z-10 flex shrink-0 flex-wrap justify-end gap-2 border-t border-zinc-800/80 bg-zinc-900/85 px-4 py-3 backdrop-blur-md sm:px-6"
        >
          <button
            type="button"
            class="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
            :disabled="cargando"
            @click="emit('cerrar')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-5 py-2.5 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            :disabled="cargando || cruces.length === 0"
            @click="confirmarAplicar"
          >
            <svg
              v-if="cargando"
              class="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Aplicar al fixture
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
