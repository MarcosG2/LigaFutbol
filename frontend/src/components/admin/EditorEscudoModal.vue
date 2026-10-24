<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  abierto: boolean
  imagenUrl: string
  encuadreX: number
  encuadreY: number
}>()

const emit = defineEmits<{
  cerrar: []
  confirmar: [encuadreX: number, encuadreY: number]
}>()

const encuadreLocalX = ref(50)
const encuadreLocalY = ref(50)
const arrastrando = ref(false)
const ultimoPuntero = ref({ x: 0, y: 0 })

const estiloImagen = computed(() => ({
  objectPosition: `${encuadreLocalX.value}% ${encuadreLocalY.value}%`,
}))

watch(
  () => props.abierto,
  (abierto) => {
    if (abierto) {
      encuadreLocalX.value = props.encuadreX
      encuadreLocalY.value = props.encuadreY
    }
  },
)

function limitar(valor: number): number {
  return Math.min(100, Math.max(0, valor))
}

function iniciarArrastre(evento: PointerEvent) {
  arrastrando.value = true
  ultimoPuntero.value = { x: evento.clientX, y: evento.clientY }
  ;(evento.currentTarget as HTMLElement).setPointerCapture(evento.pointerId)
}

function moverArrastre(evento: PointerEvent) {
  if (!arrastrando.value) return

  const deltaX = evento.clientX - ultimoPuntero.value.x
  const deltaY = evento.clientY - ultimoPuntero.value.y
  ultimoPuntero.value = { x: evento.clientX, y: evento.clientY }

  encuadreLocalX.value = limitar(encuadreLocalX.value - deltaX * 0.35)
  encuadreLocalY.value = limitar(encuadreLocalY.value - deltaY * 0.35)
}

function finalizarArrastre(evento: PointerEvent) {
  if (!arrastrando.value) return
  arrastrando.value = false
  ;(evento.currentTarget as HTMLElement).releasePointerCapture(evento.pointerId)
}

function centrar() {
  encuadreLocalX.value = 50
  encuadreLocalY.value = 50
}

function cancelar() {
  emit('cerrar')
}

function aplicar() {
  emit('confirmar', encuadreLocalX.value, encuadreLocalY.value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="abierto"
      class="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-editor-escudo"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Cerrar editor de escudo"
        @click="cancelar"
      />

      <div
        class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
      >
        <header class="border-b border-zinc-800 px-5 py-4">
          <h3 id="titulo-editor-escudo" class="text-base font-semibold text-white">
            Ajustar escudo
          </h3>
          <p class="mt-1 text-xs text-zinc-400">
            Arrastrá la imagen dentro del círculo para encuadrarla.
          </p>
        </header>

        <div class="flex flex-col items-center px-5 py-6">
          <div
            class="touch-none select-none overflow-hidden rounded-full border-2 border-yellow-500/50 bg-zinc-950 shadow-inner"
            :class="arrastrando ? 'cursor-grabbing' : 'cursor-grab'"
            style="width: 14rem; height: 14rem"
            @pointerdown.prevent="iniciarArrastre"
            @pointermove="moverArrastre"
            @pointerup="finalizarArrastre"
            @pointercancel="finalizarArrastre"
          >
            <img
              :src="imagenUrl"
              alt="Vista previa para encuadrar"
              class="pointer-events-none h-full w-full object-cover"
              :style="estiloImagen"
              draggable="false"
            />
          </div>
        </div>

        <footer class="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            class="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500"
            @click="centrar"
          >
            Centrar
          </button>
          <button
            type="button"
            class="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white"
            @click="cancelar"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="rounded-lg bg-yellow-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-400"
            @click="aplicar"
          >
            Aplicar
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
