<script setup lang="ts">
import EscudoEquipo from '../EscudoEquipo.vue'
import HomeEmptyState from '../home/HomeEmptyState.vue'
import {
  clasesBadgePosicionPublica,
  clasesFilaTablaPublica,
  POSICIONES_PLAYOFF,
} from '../home/homeTablaZonas'
import TablaSkeleton from './TablaSkeleton.vue'
import type { filaTablaConPosicion } from '../../api/mappers'

type FilaTabla = ReturnType<typeof filaTablaConPosicion>[number]

defineProps<{
  filas: FilaTabla[]
  cargando: boolean
  error: string | null
}>()
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 shadow-sm backdrop-blur-sm"
  >
    <TablaSkeleton v-if="cargando" />

    <HomeEmptyState
      v-else-if="error"
      variante="tabla"
      titulo="No se pudo cargar la tabla"
      :descripcion="error"
    />

    <HomeEmptyState
      v-else-if="filas.length === 0"
      variante="tabla"
      titulo="Tabla vacía"
      descripcion="Todavía no hay equipos o resultados para armar la clasificación."
    />

    <template v-else>
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3 sm:px-5"
      >
        <div class="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/10 px-2 py-0.5 text-yellow-300"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
            Líder
          </span>
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Top {{ POSICIONES_PLAYOFF }}
          </span>
        </div>
        <p class="text-[11px] text-slate-500 sm:hidden">Deslizá para más columnas</p>
      </div>

      <ul class="space-y-2 px-3 py-3 sm:hidden">
        <li
          v-for="fila in filas"
          :key="fila.equipo_id"
          class="rounded-xl border border-white/[0.06] p-3 transition-all duration-200 hover:scale-[1.01]"
          :class="clasesFilaTablaPublica(fila.posicion)"
        >
          <div class="flex items-center gap-3">
            <span
              class="inline-flex h-8 min-w-8 items-center justify-center rounded-lg text-xs font-extrabold tabular-nums"
              :class="clasesBadgePosicionPublica(fila.posicion)"
            >
              {{ fila.posicion }}
            </span>
            <EscudoEquipo
              :escudo-url="fila.equipo.escudoUrl"
              :iniciales="fila.equipo.iniciales"
              :color-escudo="fila.equipo.colorEscudo"
              :nombre="fila.equipo.nombre"
              tamano="md"
              forma="circulo"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-white">{{ fila.equipo.nombre }}</p>
              <p class="mt-1 text-[10px] font-medium text-slate-500">
                PJ {{ fila.pj }} · PG {{ fila.pg }} · PE {{ fila.pe }} · PP {{ fila.pp }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-lime-400 tabular-nums">{{ fila.pts }}</p>
              <p
                v-if="fila.puntos_descontados > 0"
                class="text-[9px] font-semibold text-red-400"
              >
                −{{ fila.puntos_descontados }} pts
              </p>
            </div>
          </div>
        </li>
      </ul>

      <div
        class="hidden overflow-x-auto overscroll-x-contain px-1 pb-2 sm:block [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] lg:[mask-image:none]"
      >
        <table class="w-full min-w-[640px] text-sm">
          <thead>
            <tr
              class="border-b border-slate-800/80 text-left text-xs font-semibold uppercase tracking-wider text-sky-300/70"
            >
              <th class="w-12 px-4 py-3">#</th>
              <th class="px-3 py-3">Equipo</th>
              <th class="px-2 py-3 text-center">PJ</th>
              <th class="px-2 py-3 text-center">PG</th>
              <th class="px-2 py-3 text-center">PE</th>
              <th class="hidden px-2 py-3 text-center md:table-cell">PP</th>
              <th class="hidden px-2 py-3 text-center lg:table-cell">GF</th>
              <th class="hidden px-2 py-3 text-center lg:table-cell">GC</th>
              <th class="px-3 py-3 text-center">PTS</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fila in filas"
              :key="fila.equipo_id"
              class="border-b border-slate-800/60 transition-all duration-200 last:border-b-0 hover:scale-[1.005]"
              :class="clasesFilaTablaPublica(fila.posicion)"
            >
              <td class="px-4 py-3">
                <span
                  class="inline-flex h-8 min-w-8 items-center justify-center rounded-lg text-xs font-bold tabular-nums"
                  :class="clasesBadgePosicionPublica(fila.posicion)"
                >
                  {{ fila.posicion }}
                </span>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-3">
                  <EscudoEquipo
                    :escudo-url="fila.equipo.escudoUrl"
                    :iniciales="fila.equipo.iniciales"
                    :color-escudo="fila.equipo.colorEscudo"
                    :nombre="fila.equipo.nombre"
                    tamano="md"
                    forma="circulo"
                  />
                  <span class="font-medium text-white">{{ fila.equipo.nombre }}</span>
                </div>
              </td>
              <td class="px-2 py-3 text-center tabular-nums text-slate-300">{{ fila.pj }}</td>
              <td class="px-2 py-3 text-center tabular-nums text-slate-300">{{ fila.pg }}</td>
              <td class="px-2 py-3 text-center tabular-nums text-slate-300">{{ fila.pe }}</td>
              <td class="hidden px-2 py-3 text-center tabular-nums text-slate-300 md:table-cell">
                {{ fila.pp }}
              </td>
              <td class="hidden px-2 py-3 text-center tabular-nums text-slate-300 lg:table-cell">
                {{ fila.gf }}
              </td>
              <td class="hidden px-2 py-3 text-center tabular-nums text-slate-300 lg:table-cell">
                {{ fila.gc }}
              </td>
              <td class="px-3 py-3 text-center">
                <span class="text-base font-bold tabular-nums text-lime-400">{{ fila.pts }}</span>
                <span
                  v-if="fila.puntos_descontados > 0"
                  class="mt-0.5 block text-[10px] font-semibold text-red-400/90"
                >
                  −{{ fila.puntos_descontados }}
                  {{ fila.puntos_descontados === 1 ? 'pt.' : 'pts.' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer
        class="flex flex-wrap items-center gap-4 border-t border-slate-800/80 px-4 py-3.5 text-sm text-slate-400 sm:px-5"
      >
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>Clasificación a playoffs (top {{ POSICIONES_PLAYOFF }})</span>
        </div>
      </footer>
    </template>
  </div>
</template>
