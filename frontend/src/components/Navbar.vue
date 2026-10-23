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
  'relative whitespace-nowrap px-1 pb-1 text-[13px] font-bold tracking-[0.18em] uppercase transition-colors duration-200'

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
      class="relative mx-auto flex h-[4.25rem] max-w-[90rem] items-center overflow-visible px-4 sm:px-6 lg:h-[4.5rem] lg:px-10"
      aria-label="Navegación principal"
    >
      <RouterLink
        to="/"
        class="relative z-30 shrink-0 transition-opacity hover:opacity-95"
      >
        <span
          class="relative -mb-6 block h-[4.5rem] w-[4.75rem] overflow-hidden sm:-mb-7 sm:h-[5.25rem] sm:w-[5.5rem]"
        >
          <img
            :src="logoUrl"
            alt="PLU - Pro League Universitaria"
            class="pointer-events-none h-full w-auto max-w-none select-none"
            width="88"
            height="88"
          />
        </span>
      </RouterLink>

      <ul
        class="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-7 lg:flex lg:gap-10 xl:gap-12"
      >
        <li v-for="enlace in enlacesMenu" :key="enlace.ruta">
          <RouterLink :to="enlace.ruta" :class="clasesEnlace(enlace.ruta)">
            {{ enlace.etiqueta }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <ul
      class="flex gap-4 overflow-x-auto overscroll-x-contain border-t border-white/[0.06] px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
    >
      <li v-for="enlace in enlacesMenu" :key="`mobile-${enlace.ruta}`">
        <RouterLink :to="enlace.ruta" :class="clasesEnlace(enlace.ruta)">
          {{ enlace.etiqueta }}
        </RouterLink>
      </li>
    </ul>
  </header>
</template>
