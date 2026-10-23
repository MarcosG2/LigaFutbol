<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'

const route = useRoute()
const esPanelAdmin = computed(() => route.path.startsWith('/admin'))
const esVistaLogin = computed(() => route.path === '/login')
const mostrarNavbar = computed(() => !esPanelAdmin.value && !esVistaLogin.value)
</script>

<template>
  <div
    class="flex min-h-0 flex-1 flex-col text-white"
    :class="esPanelAdmin || esVistaLogin ? 'bg-zinc-950' : 'min-h-dvh bg-slate-950'"
  >
    <Navbar v-if="mostrarNavbar" />
    <main class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip">
      <RouterView />
    </main>
  </div>
</template>
