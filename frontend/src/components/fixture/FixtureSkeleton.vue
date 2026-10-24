<template>
  <div class="space-y-6" aria-hidden="true">
    <div class="flex animate-pulse gap-2 overflow-hidden">
      <div
        v-for="n in 4"
        :key="`tab-${n}`"
        class="h-10 w-24 shrink-0 rounded-xl bg-slate-800/80"
      />
    </div>
    <ul class="space-y-3">
      <li
        v-for="n in 4"
        :key="`card-${n}`"
        class="animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5"
      >
        <div class="flex flex-col gap-4 lg:grid lg:grid-cols-[7rem_1fr]">
          <div class="space-y-2 border-b border-slate-800 pb-3 lg:border-b-0 lg:pb-0">
            <div class="mx-auto h-3 w-20 rounded bg-slate-700/60 lg:mx-0" />
            <div class="mx-auto h-6 w-14 rounded bg-slate-700/70 lg:mx-0" />
            <div class="mx-auto h-2.5 w-16 rounded bg-slate-700/50 lg:mx-0" />
          </div>
          <div class="flex items-center justify-between gap-4">
            <div class="flex flex-1 flex-col items-center gap-2">
              <div class="h-12 w-12 rounded-full bg-slate-700/80" />
              <div class="h-2.5 w-20 rounded bg-slate-700/50" />
            </div>
            <div class="h-8 w-12 rounded bg-slate-700/60" />
            <div class="flex flex-1 flex-col items-center gap-2">
              <div class="h-12 w-12 rounded-full bg-slate-700/80" />
              <div class="h-2.5 w-20 rounded bg-slate-700/50" />
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
