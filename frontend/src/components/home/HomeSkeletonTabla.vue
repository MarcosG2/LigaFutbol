<template>
  <div class="px-3 pb-3 sm:px-4" aria-hidden="true">
    <div class="space-y-2 animate-pulse">
      <div
        v-for="n in 6"
        :key="n"
        class="flex items-center gap-3 rounded-xl bg-slate-800/40 px-3 py-3"
      >
        <div class="h-6 w-6 shrink-0 rounded-md bg-slate-700/80" />
        <div class="h-8 w-8 shrink-0 rounded-full bg-slate-700/70" />
        <div class="h-3 flex-1 rounded bg-slate-700/50" />
        <div class="hidden h-3 w-6 rounded bg-slate-700/40 sm:block" />
        <div class="h-4 w-8 rounded bg-slate-700/60" />
      </div>
    </div>
  </div>
</template>
