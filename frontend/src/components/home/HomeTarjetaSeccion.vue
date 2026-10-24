<script setup lang="ts">
defineProps<{
  titulo: string
  etiqueta?: string | null
}>()
</script>

<template>
  <article
    class="flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md hover:shadow-black/20"
  >
    <header class="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
      <div class="flex items-start justify-between gap-3">
        <h2
          class="flex items-center gap-2 text-sm font-extrabold tracking-wide text-white uppercase"
        >
          <span
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-400"
            aria-hidden="true"
          >
            <slot name="icono" />
          </span>
          {{ titulo }}
        </h2>
        <span
          v-if="etiqueta"
          class="shrink-0 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-yellow-300 uppercase"
        >
          {{ etiqueta }}
        </span>
      </div>
      <div
        class="mt-3 h-px bg-gradient-to-r from-lime-400/70 via-lime-400/30 to-transparent"
        aria-hidden="true"
      />
    </header>

    <div class="flex flex-1 flex-col">
      <slot />
    </div>

    <footer
      v-if="$slots.pie"
      class="mt-auto border-t border-white/[0.06] px-4 py-3.5 sm:px-5"
    >
      <slot name="pie" />
    </footer>
  </article>
</template>
