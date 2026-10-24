<template>
  <div class="px-3 py-4 sm:px-5" aria-hidden="true">
    <div class="mb-4 hidden h-8 animate-pulse rounded-lg bg-slate-800/50 sm:block" />
    <div class="space-y-2 animate-pulse">
      <div
        v-for="n in 10"
        :key="n"
        class="flex items-center gap-3 rounded-xl bg-slate-800/40 px-3 py-3.5"
      >
        <div class="h-7 w-7 shrink-0 rounded-lg bg-slate-700/80" />
        <div class="h-9 w-9 shrink-0 rounded-full bg-slate-700/70" />
        <div class="h-3 flex-1 rounded bg-slate-700/50" />
        <div class="hidden h-3 w-8 rounded bg-slate-700/40 sm:block" />
        <div class="h-4 w-10 rounded bg-slate-700/60" />
      </div>
    </div>
  </div>
</template>
