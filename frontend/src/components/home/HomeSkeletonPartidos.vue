<template>
  <ul class="divide-y divide-white/[0.06] px-3 sm:px-4" aria-hidden="true">
    <li v-for="n in 3" :key="n" class="flex animate-pulse items-center gap-3 py-4">
      <div class="flex flex-1 flex-col items-center gap-2">
        <div class="h-10 w-10 rounded-full bg-slate-700/80" />
        <div class="h-2.5 w-16 rounded bg-slate-700/60" />
      </div>
      <div class="h-4 w-6 rounded bg-slate-700/50" />
      <div class="flex flex-1 flex-col items-center gap-2">
        <div class="h-10 w-10 rounded-full bg-slate-700/80" />
        <div class="h-2.5 w-16 rounded bg-slate-700/60" />
      </div>
      <div class="flex w-20 flex-col gap-2 border-l border-white/[0.06] pl-3">
        <div class="h-2 w-full rounded bg-slate-700/50" />
        <div class="h-2 w-3/4 rounded bg-slate-700/40" />
      </div>
    </li>
  </ul>
</template>
