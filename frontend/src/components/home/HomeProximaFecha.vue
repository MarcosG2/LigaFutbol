<script setup lang="ts">
import EscudoEquipo from '../EscudoEquipo.vue'
import type { PartidoProximoUi } from '../../composables/useDatosInicio'
import HomeEmptyState from './HomeEmptyState.vue'
import HomeSkeletonPartidos from './HomeSkeletonPartidos.vue'
import HomeTarjetaSeccion from './HomeTarjetaSeccion.vue'

defineProps<{
  partidos: PartidoProximoUi[]
  cargando: boolean
  numeroFecha: number | null
}>()
</script>

<template>
  <HomeTarjetaSeccion
    titulo="Próxima fecha"
    :etiqueta="numeroFecha != null ? `Fecha ${numeroFecha}` : undefined"
  >
    <template #icono>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-4 w-4"
      >
        <path
          d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm13 8H4v10h16V10z"
        />
      </svg>
    </template>

    <HomeSkeletonPartidos v-if="cargando" />

    <HomeEmptyState
      v-else-if="partidos.length === 0"
      variante="calendario"
      titulo="Sin partidos programados"
      descripcion="No hay partidos programados para la próxima fecha."
    />

    <ul v-else class="divide-y divide-white/[0.06] px-2 sm:px-3">
      <li
        v-for="(partido, indice) in partidos"
        :key="indice"
        class="flex items-center gap-2 px-2 py-3.5 transition-all duration-200 hover:scale-[1.01] hover:bg-white/[0.02] sm:gap-3 sm:py-4"
      >
        <div class="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          <EscudoEquipo
            :escudo-url="partido.local.escudoUrl"
            :iniciales="partido.local.iniciales"
            :color-escudo="partido.local.colorEscudo"
            :nombre="partido.local.nombre"
            tamano="md"
            forma="circulo"
          />
          <span class="line-clamp-2 text-[10px] font-bold leading-tight text-white uppercase">
            {{ partido.local.nombre }}
          </span>
        </div>

        <span class="shrink-0 text-sm font-extrabold tracking-tight text-lime-400">VS</span>

        <div class="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          <EscudoEquipo
            :escudo-url="partido.visitante.escudoUrl"
            :iniciales="partido.visitante.iniciales"
            :color-escudo="partido.visitante.colorEscudo"
            :nombre="partido.visitante.nombre"
            tamano="md"
            forma="circulo"
          />
          <span class="line-clamp-2 text-[10px] font-bold leading-tight text-white uppercase">
            {{ partido.visitante.nombre }}
          </span>
        </div>

        <div
          class="flex w-[5.25rem] shrink-0 flex-col gap-1.5 border-l border-white/[0.06] pl-2.5 text-[9px] font-semibold leading-snug tracking-wide text-yellow-300/90 uppercase"
        >
          <span class="inline-flex items-start gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="mt-0.5 h-3 w-3 shrink-0"
              aria-hidden="true"
            >
              <path
                d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 5v4.3l3.2 1.9-.9 1.5L11 13V7h2z"
              />
            </svg>
            {{ partido.hora }}
          </span>
          <span class="inline-flex items-start gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="mt-0.5 h-3 w-3 shrink-0"
              aria-hidden="true"
            >
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
              />
            </svg>
            {{ partido.cancha }}
          </span>
        </div>
      </li>
    </ul>

    <template #pie>
      <RouterLink
        to="/fixture"
        class="inline-flex items-center gap-1 text-[11px] font-extrabold tracking-wider text-lime-400 uppercase transition-all duration-200 hover:translate-x-0.5 hover:text-lime-300"
      >
        Ver fixture completo
        <span aria-hidden="true">→</span>
      </RouterLink>
    </template>
  </HomeTarjetaSeccion>
</template>
