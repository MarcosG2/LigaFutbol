<script setup lang="ts">
import { useRoute } from 'vue-router'
import { logoUrl } from '../assets/imagenes'

const route = useRoute()

const enlacesMenu = [
  { etiqueta: 'INICIO', ruta: '/' },
  { etiqueta: 'FIXTURE', ruta: '/fixture' },
  { etiqueta: 'TABLA', ruta: '/tabla' },
  { etiqueta: 'EQUIPOS', ruta: '/equipos' },
] as const

function enlaceActivo(rutaEnlace: string) {
  if (rutaEnlace === '/') {
    return route.path === '/'
  }
  return route.path === rutaEnlace || route.path.startsWith(`${rutaEnlace}/`)
}

const claseEnlaceBase =
  'relative whitespace-nowrap px-0.5 pb-1 text-[11px] font-bold tracking-[0.14em] uppercase transition-colors duration-200 sm:text-[12px] sm:tracking-[0.16em] lg:text-[13px] lg:tracking-[0.18em]'

function clasesEnlace(rutaEnlace: string) {
  const activo = enlaceActivo(rutaEnlace)
  return [
    claseEnlaceBase,
    activo
      ? 'text-[#A3CF43] after:absolute after:inset-x-0 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-[#A3CF43]'
      : 'text-white hover:text-[#A3CF43]/85',
  ]
}
</script>

<template>
  <header class="relative z-50 bg-[#0a0a0a]">
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c4a035]/50 to-transparent"
      aria-hidden="true"
    />

    <nav
      class="relative mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:px-6 lg:h-[4.5rem] lg:gap-6 lg:px-10"
      aria-label="Navegación principal"
    >
      <RouterLink
        to="/"
        class="relative z-10 shrink-0 transition-opacity hover:opacity-95"
      >
        <img
          :src="logoUrl"
          alt="PLU - Pro League Universitaria"
          class="pointer-events-none h-12 w-auto select-none sm:h-14 lg:h-[3.75rem]"
          width="88"
          height="88"
        />
      </RouterLink>

      <ul
        class="flex min-w-0 items-center justify-end gap-3 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 lg:gap-10 xl:gap-12 [&::-webkit-scrollbar]:hidden"
      >
        <li v-for="enlace in enlacesMenu" :key="enlace.ruta" class="shrink-0">
          <RouterLink :to="enlace.ruta" :class="clasesEnlace(enlace.ruta)">
            {{ enlace.etiqueta }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
