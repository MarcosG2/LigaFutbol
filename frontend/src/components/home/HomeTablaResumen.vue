<script setup lang="ts">
import EscudoEquipo from '../EscudoEquipo.vue'
import HomeEmptyState from './HomeEmptyState.vue'
import HomeSkeletonTabla from './HomeSkeletonTabla.vue'
import HomeTarjetaSeccion from './HomeTarjetaSeccion.vue'
import {
  clasesBadgePosicion,
  clasesFilaTabla,
  POSICIONES_PLAYOFF,
} from './homeTablaZonas'
import type { filaTablaConPosicion } from '../../api/mappers'

type FilaTabla = ReturnType<typeof filaTablaConPosicion>[number]

defineProps<{
  filas: FilaTabla[]
  cargando: boolean
  totalEquipos: number
  etiquetaFecha?: string | null
}>()
</script>

<template>
  <HomeTarjetaSeccion
    titulo="Tabla de posiciones"
    :etiqueta="etiquetaFecha ?? undefined"
  >
    <template #icono>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-4 w-4"
      >
        <path
          d="M6 3h12v2h1a1 1 0 0 1 1 1v2H4V6a1 1 0 0 1 1-1h1V3zm2 16H7v-2H5v4h14v-4h-2v2h-1v-5H8v5zm2-14h8V4H8v1zM6 9v8h12V9H6zm2 2h2v4H8v-4zm4 0h4v4h-4v-4z"
        />
      </svg>
    </template>

    <HomeSkeletonTabla v-if="cargando" />

    <HomeEmptyState
      v-else-if="filas.length === 0"
      variante="tabla"
      titulo="Sin datos en la tabla"
      descripcion="Cuando se registren resultados, las posiciones aparecerán acá."
    />

    <template v-else>
      <div
        class="flex flex-wrap gap-2 px-4 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
      >
        <span class="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/10 px-2 py-0.5 text-yellow-300">
          <span class="h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
          Líder
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Top {{ POSICIONES_PLAYOFF }}
        </span>
      </div>

      <!-- Tarjetas compactas — mobile -->
      <ul class="space-y-2 px-3 pb-3 sm:hidden">
        <li
          v-for="fila in filas"
          :key="fila.equipo_id"
          class="rounded-xl border border-white/[0.06] p-3 transition-all duration-200 hover:scale-[1.01]"
          :class="clasesFilaTabla(fila.posicion, totalEquipos)"
        >
          <div class="flex items-center gap-3">
            <span
              class="inline-flex h-7 min-w-7 items-center justify-center rounded-lg text-xs font-extrabold tabular-nums"
              :class="clasesBadgePosicion(fila.posicion, totalEquipos)"
            >
              {{ fila.posicion }}
            </span>
            <EscudoEquipo
              :escudo-url="fila.equipo.escudoUrl"
              :iniciales="fila.equipo.iniciales"
              :color-escudo="fila.equipo.colorEscudo"
              :nombre="fila.equipo.nombre"
              tamano="sm"
              forma="circulo"
            />
            <span class="min-w-0 flex-1 truncate text-xs font-bold text-white uppercase">
              {{ fila.equipo.nombre }}
            </span>
            <div class="text-right">
              <p class="text-lg font-extrabold text-lime-400 tabular-nums">{{ fila.pts }}</p>
              <p class="text-[9px] font-semibold text-slate-500 uppercase">PTS</p>
            </div>
          </div>
          <div
            class="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] font-semibold text-slate-400"
          >
            <span>PJ {{ fila.pj }}</span>
            <span>PG {{ fila.pg }}</span>
            <span>PE {{ fila.pe }}</span>
            <span>PP {{ fila.pp }}</span>
          </div>
        </li>
      </ul>

      <!-- Tabla — sm+ -->
      <div class="relative hidden sm:block">
        <p class="px-4 pb-2 text-center text-[10px] text-slate-500 md:hidden">
          Deslizá para ver todas las columnas
        </p>
        <div
          class="overflow-x-auto overscroll-x-contain px-2 pb-2 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]"
        >
          <table class="w-full min-w-[300px] text-left text-[11px]">
            <thead>
              <tr
                class="text-[9px] font-bold tracking-wider text-slate-500 uppercase"
              >
                <th class="px-2 py-2 w-8">#</th>
                <th class="px-1 py-2">Equipo</th>
                <th class="px-1 py-2 text-center">PJ</th>
                <th class="hidden px-1 py-2 text-center sm:table-cell">PG</th>
                <th class="hidden px-1 py-2 text-center md:table-cell">PE</th>
                <th class="hidden px-1 py-2 text-center md:table-cell">PP</th>
                <th class="px-2 py-2 text-center text-lime-400">PTS</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fila in filas"
                :key="fila.equipo_id"
                class="border-t border-white/[0.05] transition-all duration-200 hover:scale-[1.01]"
                :class="clasesFilaTabla(fila.posicion, totalEquipos)"
              >
                <td class="px-2 py-2.5">
                  <span
                    class="inline-flex h-6 min-w-6 items-center justify-center rounded-md text-[10px] font-extrabold tabular-nums"
                    :class="clasesBadgePosicion(fila.posicion, totalEquipos)"
                  >
                    {{ fila.posicion }}
                  </span>
                </td>
                <td class="px-1 py-2.5">
                  <div class="flex items-center gap-2">
                    <EscudoEquipo
                      :escudo-url="fila.equipo.escudoUrl"
                      :iniciales="fila.equipo.iniciales"
                      :color-escudo="fila.equipo.colorEscudo"
                      :nombre="fila.equipo.nombre"
                      tamano="sm"
                      forma="circulo"
                    />
                    <span class="max-w-[7rem] truncate font-bold text-[10px] text-white uppercase md:max-w-none">
                      {{ fila.equipo.nombre }}
                    </span>
                  </div>
                </td>
                <td class="px-1 py-2.5 text-center text-slate-400 tabular-nums">
                  {{ fila.pj }}
                </td>
                <td class="hidden px-1 py-2.5 text-center text-slate-400 tabular-nums sm:table-cell">
                  {{ fila.pg }}
                </td>
                <td class="hidden px-1 py-2.5 text-center text-slate-400 tabular-nums md:table-cell">
                  {{ fila.pe }}
                </td>
                <td class="hidden px-1 py-2.5 text-center text-slate-400 tabular-nums md:table-cell">
                  {{ fila.pp }}
                </td>
                <td
                  class="px-2 py-2.5 text-center text-sm font-extrabold text-lime-400 tabular-nums"
                >
                  {{ fila.pts }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <template #pie>
      <RouterLink
        to="/tabla"
        class="inline-flex items-center gap-1 text-[11px] font-extrabold tracking-wider text-lime-400 uppercase transition-all duration-200 hover:translate-x-0.5 hover:text-lime-300"
      >
        Ver tabla completa
        <span aria-hidden="true">→</span>
      </RouterLink>
    </template>
  </HomeTarjetaSeccion>
</template>
