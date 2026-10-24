<script setup lang="ts">
defineProps<{
  titulo: string
  descripcion: string
  variante?: 'calendario' | 'tabla' | 'resultados'
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12"
    role="status"
  >
    <div
      class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-lime-400 ring-1 ring-white/10"
      aria-hidden="true"
    >
      <svg
        v-if="variante === 'tabla'"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-7 w-7"
      >
        <path
          d="M6 3h12v2h1a1 1 0 0 1 1 1v2H4V6a1 1 0 0 1 1-1h1V3zm2 16H7v-2H5v4h14v-4h-2v2h-1v-5H8v5zm2-14h8V4H8v1zM6 9v8h12V9H6zm2 2h2v4H8v-4zm4 0h4v4h-4v-4z"
        />
      </svg>
      <svg
        v-else-if="variante === 'resultados'"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-7 w-7"
      >
        <path
          d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 4v5h4v2h-6V6h2z"
        />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-7 w-7"
      >
        <path
          d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm13 8H4v10h16V10z"
        />
      </svg>
    </div>
    <p class="text-sm font-bold text-white">{{ titulo }}</p>
    <p class="mt-1 max-w-xs text-sm text-slate-400">{{ descripcion }}</p>
  </div>
</template>
