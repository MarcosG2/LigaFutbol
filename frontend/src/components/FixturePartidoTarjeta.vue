<script setup lang="ts">
import { computed } from 'vue'
import EscudoEquipo from './EscudoEquipo.vue'

export type EquipoFixtureTarjeta = {
  nombre: string
  iniciales: string
  colorEscudo: string
  escudoUrl?: string | null
}

export type PartidoFixtureTarjeta = {
  id: number
  fechaDia: string
  hora: string
  cancha: string
  local: EquipoFixtureTarjeta
  visitante: EquipoFixtureTarjeta
  golesLocal: number | null
  golesVisitante: number | null
  estado: 'Jugado' | 'Pendiente' | string
}

const props = defineProps<{
  partido: PartidoFixtureTarjeta
}>()

const tieneResultado = computed(
  () =>
    props.partido.estado === 'Jugado' ||
    (props.partido.golesLocal !== null && props.partido.golesVisitante !== null),
)

const etiquetaEstado = computed(() =>
  tieneResultado.value ? 'Finalizado' : 'Programado',
)
</script>

<template>
  <article
    class="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:border-yellow-400/35 hover:bg-slate-900/80 hover:shadow-md hover:shadow-black/20 sm:px-5 sm:py-5"
  >
    <div
      class="flex flex-col gap-4 lg:grid lg:grid-cols-[7.5rem_minmax(0,1fr)] lg:items-center lg:gap-6"
    >
      <div
        class="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-b border-slate-800/80 pb-3 text-center sm:gap-x-4 lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:pb-0 lg:text-left"
      >
        <span
          class="rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase"
          :class="
            tieneResultado
              ? 'bg-lime-400/15 text-lime-300 ring-1 ring-lime-400/25'
              : 'bg-yellow-400/10 text-yellow-300 ring-1 ring-yellow-400/20'
          "
        >
          {{ etiquetaEstado }}
        </span>
        <span class="w-full text-sm font-medium text-sky-300/90 lg:w-auto">
          {{ partido.fechaDia }}
        </span>
        <span class="font-oswald text-lg font-bold text-yellow-400 sm:text-xl">
          {{ partido.hora }}
        </span>
        <span class="text-xs text-zinc-400 sm:text-sm">{{ partido.cancha }}</span>
      </div>

      <div
        class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 md:gap-5"
      >
        <div class="flex min-w-0 flex-col items-center gap-2 text-center md:items-end md:pr-2">
          <EscudoEquipo
            :escudo-url="partido.local.escudoUrl"
            :iniciales="partido.local.iniciales"
            :color-escudo="partido.local.colorEscudo"
            :nombre="partido.local.nombre"
            tamano="lg"
            forma="circulo"
          />
          <span
            class="line-clamp-2 w-full text-[11px] font-bold uppercase leading-tight text-white sm:text-xs md:text-right md:text-sm"
          >
            {{ partido.local.nombre }}
          </span>
        </div>

        <span
          v-if="tieneResultado"
          class="px-0.5 font-oswald text-xl font-black tabular-nums tracking-tight text-[#A3CF43] sm:text-2xl md:text-3xl"
        >
          {{ partido.golesLocal }} - {{ partido.golesVisitante }}
        </span>
        <span
          v-else
          class="px-0.5 font-oswald text-xl font-black italic tracking-tight text-yellow-500 sm:text-2xl md:text-3xl"
        >
          VS
        </span>

        <div class="flex min-w-0 flex-col items-center gap-2 text-center md:items-start md:pl-2">
          <EscudoEquipo
            :escudo-url="partido.visitante.escudoUrl"
            :iniciales="partido.visitante.iniciales"
            :color-escudo="partido.visitante.colorEscudo"
            :nombre="partido.visitante.nombre"
            tamano="lg"
            forma="circulo"
          />
          <span
            class="line-clamp-2 w-full text-[11px] font-bold uppercase leading-tight text-white sm:text-xs md:text-left md:text-sm"
          >
            {{ partido.visitante.nombre }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>
