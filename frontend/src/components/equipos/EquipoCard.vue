<script setup lang="ts">
defineProps<{
  nombre: string
  subtitulo: string
  iniciales: string
  colorEscudo: string
  escudoUrl: string | null
  cantidadJugadores: number
  colorTextoEscudo: string
}>()

defineEmits<{
  abrir: []
}>()
</script>

<template>
  <button
    type="button"
    class="group flex w-full min-h-[220px] flex-col items-center rounded-2xl border border-slate-800/80 bg-slate-900/55 px-4 py-8 text-center shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-yellow-400/30 hover:bg-slate-900/75 hover:shadow-md hover:shadow-black/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50"
    @click="$emit('abrir')"
  >
    <div
      v-if="escudoUrl"
      class="mb-4 h-24 w-24 overflow-hidden rounded-full ring-2 ring-white/10 transition-transform duration-200 group-hover:scale-105"
    >
      <img
        :src="escudoUrl"
        :alt="`Escudo de ${nombre}`"
        class="h-full w-full object-cover"
      />
    </div>
    <div
      v-else
      class="mb-4 flex h-24 w-24 items-center justify-center rounded-full text-2xl font-black shadow-inner ring-2 ring-white/10 transition-transform duration-200 group-hover:scale-105"
      :style="{
        backgroundColor: colorEscudo,
        color: colorTextoEscudo,
      }"
    >
      {{ iniciales }}
    </div>

    <h2 class="font-oswald text-lg font-bold uppercase tracking-wide text-white">
      {{ nombre }}
    </h2>
    <p class="mt-1 line-clamp-2 text-sm text-sky-300/80">{{ subtitulo }}</p>

    <span
      class="mt-4 inline-flex items-center rounded-full border border-slate-700/80 bg-slate-950/50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase"
    >
      {{ cantidadJugadores }}
      {{ cantidadJugadores === 1 ? 'jugador' : 'jugadores' }}
    </span>
  </button>
</template>

<style scoped>
.font-oswald {
  font-family: Oswald, system-ui, sans-serif;
}
</style>
