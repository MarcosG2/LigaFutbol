<script setup lang="ts">
import EscudoEquipo from '../EscudoEquipo.vue'
import type { ResultadoRecienteUi } from '../../composables/useDatosInicio'
import HomeEmptyState from './HomeEmptyState.vue'
import HomeSkeletonPartidos from './HomeSkeletonPartidos.vue'
import HomeTarjetaSeccion from './HomeTarjetaSeccion.vue'

defineProps<{
  resultados: ResultadoRecienteUi[]
  cargando: boolean
  etiquetaFecha?: string | null
}>()
</script>

<template>
  <HomeTarjetaSeccion
    titulo="Últimos resultados"
    :etiqueta="etiquetaFecha ?? undefined"
  >
    <template #icono>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-4 w-4"
      >
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 4v5h4v2h-6V6h2z" />
      </svg>
    </template>

    <HomeSkeletonPartidos v-if="cargando" />

    <HomeEmptyState
      v-else-if="resultados.length === 0"
      variante="resultados"
      titulo="Sin resultados recientes"
      descripcion="Los partidos finalizados se mostrarán acá."
    />

    <ul v-else class="divide-y divide-white/[0.06]">
      <li
        v-for="(resultado, indice) in resultados"
        :key="indice"
        class="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 py-3.5 transition-all duration-200 hover:scale-[1.01] hover:bg-white/[0.02] sm:flex-nowrap sm:px-4"
      >
        <div class="flex min-w-0 flex-1 items-center gap-1.5 text-[10px]">
          <EscudoEquipo
            :escudo-url="resultado.local.escudoUrl"
            :iniciales="resultado.local.iniciales"
            :color-escudo="resultado.local.colorEscudo"
            :nombre="resultado.local.nombre"
            tamano="sm"
            forma="circulo"
          />
          <span class="truncate font-bold text-white uppercase">
            {{ resultado.local.nombre }}
          </span>
        </div>

        <span class="shrink-0 px-1 text-base font-extrabold text-lime-400 tabular-nums">
          {{ resultado.golesLocal }} - {{ resultado.golesVisitante }}
        </span>

        <div
          class="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right text-[10px]"
        >
          <span class="truncate font-bold text-white uppercase">
            {{ resultado.visitante.nombre }}
          </span>
          <EscudoEquipo
            :escudo-url="resultado.visitante.escudoUrl"
            :iniciales="resultado.visitante.iniciales"
            :color-escudo="resultado.visitante.colorEscudo"
            :nombre="resultado.visitante.nombre"
            tamano="sm"
            forma="circulo"
          />
        </div>

        <div
          class="flex w-[4.25rem] shrink-0 flex-col items-end gap-1 border-l border-white/[0.06] pl-2"
        >
          <span class="text-[8px] font-semibold tracking-wide text-slate-500 uppercase">
            {{ resultado.fecha }}
          </span>
          <span
            class="rounded-md bg-lime-400/90 px-1.5 py-0.5 text-[8px] font-extrabold tracking-wider text-slate-950 uppercase"
          >
            Final
          </span>
        </div>
      </li>
    </ul>

    <template #pie>
      <RouterLink
        to="/fixture"
        class="inline-flex items-center gap-1 text-[11px] font-extrabold tracking-wider text-lime-400 uppercase transition-all duration-200 hover:translate-x-0.5 hover:text-lime-300"
      >
        Ver todos los resultados
        <span aria-hidden="true">→</span>
      </RouterLink>
    </template>
  </HomeTarjetaSeccion>
</template>
