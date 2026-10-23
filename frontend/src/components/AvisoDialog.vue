<script setup lang="ts">
withDefaults(
  defineProps<{
    abierto: boolean
    titulo?: string
    mensaje: string
  }>(),
  { titulo: 'Aviso' },
)

const emit = defineEmits<{
  cerrar: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="abierto"
      class="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titulo ? 'aviso-dialog-titulo' : undefined"
      aria-describedby="aviso-dialog-mensaje"
    >
      <div
        class="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden="true"
        @click="emit('cerrar')"
      />

      <div
        class="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-amber-500/40 bg-zinc-900 shadow-2xl shadow-black/50"
        @click.stop
      >
        <header class="border-b border-zinc-800/80 bg-amber-500/10 px-5 py-4">
          <h3 id="aviso-dialog-titulo" class="text-base font-semibold text-amber-200">
            {{ titulo }}
          </h3>
        </header>
        <p id="aviso-dialog-mensaje" class="px-5 py-4 text-sm leading-relaxed text-zinc-200">
          {{ mensaje }}
        </p>
        <footer class="flex justify-end border-t border-zinc-800/80 px-5 py-3">
          <button
            type="button"
            class="rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-2 text-sm font-bold text-black shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105"
            @click="emit('cerrar')"
          >
            Entendido
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
