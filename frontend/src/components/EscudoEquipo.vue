<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    escudoUrl?: string | null
    iniciales: string
    colorEscudo: string
    nombre: string
    tamano?: 'sm' | 'md' | 'lg'
    forma?: 'circulo' | 'cuadrado'
  }>(),
  {
    tamano: 'lg',
    forma: 'circulo',
  },
)

const clasesContenedor = computed(() => {
  const forma = props.forma === 'circulo' ? 'rounded-full' : 'rounded-sm'
  const tamano =
    props.tamano === 'sm'
      ? 'h-7 w-7 text-[8px]'
      : props.tamano === 'md'
        ? 'h-11 w-11 text-[10px]'
        : 'h-16 w-16 text-sm'
  return `flex shrink-0 items-center justify-center overflow-hidden border border-slate-700 font-bold text-white shadow-inner ${forma} ${tamano}`
})

const colorTexto = computed(() =>
  props.colorEscudo === '#e2e8f0' || props.colorEscudo === '#f8fafc' ? '#0f172a' : 'white',
)
</script>

<template>
  <div
    v-if="escudoUrl"
    :class="clasesContenedor"
    class="!border-white/10 bg-slate-900 p-0"
  >
    <img
      :src="escudoUrl"
      :alt="`Escudo de ${nombre}`"
      class="block h-full w-full object-cover object-center"
    />
  </div>
  <span
    v-else
    :class="clasesContenedor"
    :style="{ backgroundColor: colorEscudo, color: colorTexto }"
  >
    {{ iniciales }}
  </span>
</template>
