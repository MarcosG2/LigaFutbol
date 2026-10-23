<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ErrorApi } from '../api/cliente'
import { estadioUrl } from '../assets/imagenes'
import { iniciarSesion as apiIniciarSesion } from '../api/authApi'

const router = useRouter()
const route = useRoute()

const email = ref('')
const contrasena = ref('')
const cargando = ref(false)
const errorLogin = ref<string | null>(null)

async function iniciarSesion() {
  cargando.value = true
  errorLogin.value = null
  try {
    await apiIniciarSesion(email.value.trim(), contrasena.value)
    const destino =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/admin')
        ? route.query.redirect
        : '/admin'
    await router.push(destino)
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 401) {
      errorLogin.value = 'Usuario o contraseña incorrectos.'
    } else {
      errorLogin.value = 'No se pudo conectar con el servidor.'
    }
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center px-4 py-10">
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${estadioUrl})` }"
      aria-hidden="true"
    />
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      aria-hidden="true"
    />

    <div
      class="relative z-10 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950/90 p-8 shadow-2xl shadow-black/50"
    >
      <header class="mb-8 flex flex-col items-center text-center">
        <div
          class="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-yellow-500/40 bg-zinc-900 text-2xl font-bold text-yellow-500"
          aria-hidden="true"
        >
          LF
        </div>
        <h1 class="font-oswald text-xl font-bold tracking-[0.2em] text-yellow-500 uppercase">
          Acceso administrador
        </h1>
      </header>

      <form class="space-y-5" @submit.prevent="iniciarSesion">
        <div>
          <label for="login-email" class="mb-1.5 block text-sm font-medium text-zinc-400">
            Email
          </label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            required
            class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            placeholder="admin@liga.local"
          />
        </div>

        <div>
          <label for="login-contrasena" class="mb-1.5 block text-sm font-medium text-zinc-400">
            Contraseña
          </label>
          <input
            id="login-contrasena"
            v-model="contrasena"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            placeholder="••••••••"
          />
        </div>

        <p v-if="errorLogin" class="text-center text-sm text-red-400">{{ errorLogin }}</p>

        <button
          type="submit"
          :disabled="cargando"
          class="w-full rounded-lg bg-yellow-400 py-3 text-sm font-bold tracking-wide text-black uppercase transition-colors hover:bg-yellow-300 disabled:opacity-60"
        >
          {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');

.font-oswald {
  font-family: Oswald, system-ui, sans-serif;
}
</style>
