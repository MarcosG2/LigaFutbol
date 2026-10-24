<template>
  <ul
    class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    aria-hidden="true"
  >
    <li
      v-for="n in 8"
      :key="n"
      class="animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/50 px-4 py-8"
    >
      <div class="mx-auto mb-4 h-24 w-24 rounded-full bg-slate-700/70" />
      <div class="mx-auto h-4 w-32 rounded bg-slate-700/60" />
      <div class="mx-auto mt-2 h-3 w-24 rounded bg-slate-700/40" />
    </li>
  </ul>
</template>
