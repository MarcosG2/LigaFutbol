<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ErrorApi } from '../../api/cliente'
import type { EstadoTorneo, TorneoApi } from '../../api/tipos'
import {
  actualizarTorneo,
  crearTorneo,
  eliminarTorneo,
  listarTorneos,
} from '../../api/torneosApi'

const torneos = ref<TorneoApi[]>([])
const cargando = ref(false)
const guardando = ref(false)

const modalAbierto = ref(false)
const torneoEnEdicion = ref<{ id: number; nombre: string; estado: EstadoTorneo }>({
  id: 0,
  nombre: '',
  estado: 'Activo',
})

const torneoActivo = computed(() => torneos.value.find((t) => t.estado === 'Activo') ?? null)

const tituloModal = computed(() =>
  torneoEnEdicion.value.id ? 'Editar torneo' : 'Nuevo torneo',
)

function torneoVacio() {
  return { id: 0, nombre: '', estado: 'Activo' as EstadoTorneo }
}

async function recargarTorneos() {
  cargando.value = true
  try {
    torneos.value = await listarTorneos()
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : 'No se pudieron cargar los torneos.'
    window.alert(mensaje)
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  recargarTorneos()
})

function abrirNuevoTorneo() {
  torneoEnEdicion.value = torneoVacio()
  modalAbierto.value = true
}

function abrirEditarTorneo(torneo: TorneoApi) {
  torneoEnEdicion.value = {
    id: torneo.id,
    nombre: torneo.nombre,
    estado: torneo.estado ?? 'Activo',
  }
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
  torneoEnEdicion.value = torneoVacio()
}

function mensajeErrorApi(error: unknown): string {
  if (error instanceof ErrorApi) return error.message
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

async function finalizarOtrosActivos(exceptoId: number) {
  const otrosActivos = torneos.value.filter(
    (t) => t.estado === 'Activo' && t.id !== exceptoId,
  )
  for (const torneo of otrosActivos) {
    await actualizarTorneo(torneo.id, { estado: 'Finalizado' })
  }
}

async function guardarTorneo() {
  const nombre = torneoEnEdicion.value.nombre.trim()
  if (!nombre) {
    window.alert('El nombre del torneo es obligatorio.')
    return
  }

  const { id, estado } = torneoEnEdicion.value

  if (estado === 'Activo') {
    const otroActivo = torneos.value.find((t) => t.estado === 'Activo' && t.id !== id)
    if (otroActivo) {
      const confirmar = window.confirm(
        `Ya existe el torneo activo «${otroActivo.nombre}». ¿Lo marcás como Finalizado y dejás solo «${nombre}» como Activo?`,
      )
      if (!confirmar) return
    }
  }

  guardando.value = true
  try {
    if (estado === 'Activo') {
      await finalizarOtrosActivos(id)
    }

    if (id) {
      await actualizarTorneo(id, { nombre, estado })
    } else {
      await crearTorneo({ nombre, estado })
    }

    await recargarTorneos()
    cerrarModal()
  } catch (error) {
    window.alert(mensajeErrorApi(error))
  } finally {
    guardando.value = false
  }
}

async function marcarComoActivo(torneo: TorneoApi) {
  if (torneo.estado === 'Activo') return

  const otroActivo = torneos.value.find((t) => t.estado === 'Activo')
  if (otroActivo) {
    const confirmar = window.confirm(
      `¿Marcar «${torneo.nombre}» como Activo y finalizar «${otroActivo.nombre}»?`,
    )
    if (!confirmar) return
  }

  guardando.value = true
  try {
    await finalizarOtrosActivos(torneo.id)
    await actualizarTorneo(torneo.id, { estado: 'Activo' })
    await recargarTorneos()
  } catch (error) {
    window.alert(mensajeErrorApi(error))
  } finally {
    guardando.value = false
  }
}

async function eliminarTorneoConfirmado(torneo: TorneoApi) {
  const confirmar = window.confirm(
    `¿Eliminar el torneo «${torneo.nombre}»? Si tiene partidos asociados, el servidor puede rechazar la operación.`,
  )
  if (!confirmar) return

  guardando.value = true
  try {
    await eliminarTorneo(torneo.id)
    await recargarTorneos()
  } catch (error) {
    window.alert(mensajeErrorApi(error))
  } finally {
    guardando.value = false
  }
}

function clasesEstado(estado: EstadoTorneo | null): string {
  if (estado === 'Activo') {
    return 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30'
  }
  return 'bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30'
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Gestión del <span class="text-yellow-400">torneo</span>
        </h2>
        <p class="mt-2 text-sm text-zinc-400 sm:text-base">
          Creá el torneo de la liga. Los partidos del fixture se vinculan al torneo
          <strong class="font-medium text-zinc-300">Activo</strong>.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-2.5 text-sm font-extrabold tracking-wide text-black uppercase shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105"
        @click="abrirNuevoTorneo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="h-4 w-4"
          aria-hidden="true"
        >
          <path stroke-linecap="round" d="M12 5v14M5 12h14" />
        </svg>
        Nuevo torneo
      </button>
    </header>

    <section
      v-if="torneoActivo"
      class="rounded-xl border border-green-500/25 bg-green-500/5 px-5 py-4"
    >
      <p class="text-xs font-semibold tracking-wide text-green-400/90 uppercase">
        Torneo en curso
      </p>
      <p class="mt-1 text-lg font-semibold text-white">{{ torneoActivo.nombre }}</p>
      <p class="mt-1 text-sm text-zinc-400">
        Desde acá podés cargar fechas en
        <RouterLink to="/admin/partidos" class="text-yellow-400 hover:text-yellow-300">
          Partidos
        </RouterLink>
        y ver la tabla en
        <RouterLink to="/admin/tabla" class="text-yellow-400 hover:text-yellow-300">
          Tabla de posiciones
        </RouterLink>.
      </p>
    </section>

    <section
      v-else-if="!cargando"
      class="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4"
    >
      <p class="text-sm font-medium text-amber-200">
        No hay torneo activo. Creá uno y dejalo en estado <strong>Activo</strong> para poder
        guardar fechas y partidos.
      </p>
    </section>

    <div
      v-if="cargando"
      class="rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-6 py-16 text-center text-zinc-400"
    >
      Cargando torneos…
    </div>

    <section
      v-else-if="torneos.length === 0"
      class="rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-6 py-16 text-center"
    >
      <p class="text-zinc-400">Todavía no hay torneos registrados.</p>
      <button
        type="button"
        class="mt-4 text-sm font-medium text-yellow-400 hover:text-yellow-300"
        @click="abrirNuevoTorneo"
      >
        Crear el primer torneo →
      </button>
    </section>

    <div
      v-else
      class="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm"
    >
      <table class="w-full text-left text-sm">
        <thead class="border-b border-zinc-800/80 bg-zinc-950/40 text-xs text-zinc-500 uppercase">
          <tr>
            <th class="px-5 py-3 font-semibold">Nombre</th>
            <th class="px-5 py-3 font-semibold">Estado</th>
            <th class="px-5 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/60">
          <tr v-for="torneo in torneos" :key="torneo.id" class="text-zinc-200">
            <td class="px-5 py-4 font-medium text-white">{{ torneo.nombre }}</td>
            <td class="px-5 py-4">
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="clasesEstado(torneo.estado)"
              >
                {{ torneo.estado ?? '—' }}
              </span>
            </td>
            <td class="px-5 py-4">
              <div class="flex flex-wrap justify-end gap-2">
                <button
                  v-if="torneo.estado !== 'Activo'"
                  type="button"
                  class="rounded-lg border border-green-500/40 px-3 py-1.5 text-xs font-semibold text-green-400 transition-colors hover:bg-green-500/10"
                  :disabled="guardando"
                  @click="marcarComoActivo(torneo)"
                >
                  Activar
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                  @click="abrirEditarTorneo(torneo)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                  :disabled="guardando"
                  @click="eliminarTorneoConfirmado(torneo)"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div
        v-if="modalAbierto"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-torneo"
      >
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          aria-hidden="true"
          @click="cerrarModal"
        />

        <form
          novalidate
          class="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
          @submit.prevent="guardarTorneo"
        >
          <header class="border-b border-zinc-800/80 px-6 py-4">
            <h3 id="titulo-modal-torneo" class="text-lg font-semibold text-white">
              {{ tituloModal }}
            </h3>
          </header>

          <div class="space-y-4 px-6 py-5">
            <div>
              <label for="nombre-torneo" class="mb-1.5 block text-sm font-medium text-zinc-300">
                Nombre
              </label>
              <input
                id="nombre-torneo"
                v-model="torneoEnEdicion.nombre"
                type="text"
                maxlength="100"
                required
                placeholder="Ej. Liga Universitaria 2026"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              />
            </div>

            <div>
              <label for="estado-torneo" class="mb-1.5 block text-sm font-medium text-zinc-300">
                Estado
              </label>
              <select
                id="estado-torneo"
                v-model="torneoEnEdicion.estado"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              >
                <option value="Activo">Activo</option>
                <option value="Finalizado">Finalizado</option>
              </select>
              <p class="mt-1.5 text-xs text-zinc-500">
                Solo un torneo debería estar Activo; al guardar como Activo se finalizan los demás.
              </p>
            </div>
          </div>

          <footer class="flex justify-end gap-2 border-t border-zinc-800/80 px-6 py-4">
            <button
              type="button"
              class="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              @click="cerrarModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-2 text-sm font-bold text-black shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105 disabled:opacity-60"
              :disabled="guardando"
            >
              {{ guardando ? 'Guardando…' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </div>
    </Teleport>
  </div>
</template>
