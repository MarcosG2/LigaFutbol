<script setup lang="ts">
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
}

defineProps<{
  partido: PartidoFixtureTarjeta
}>()
</script>

<template>
  <article
    class="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-4 transition-colors hover:border-yellow-500/40 hover:bg-zinc-900/70 sm:px-5 sm:py-5"
  >
    <div
      class="flex flex-col gap-4 lg:grid lg:grid-cols-[7.5rem_minmax(0,1fr)] lg:items-center lg:gap-6"
    >
      <div
        class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-zinc-800 pb-3 text-center sm:gap-x-4 lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:pb-0 lg:text-left"
      >
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
