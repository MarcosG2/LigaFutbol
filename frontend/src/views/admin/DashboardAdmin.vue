<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { estadioUrl } from '../../assets/imagenes'
import { listarEquipos } from '../../api/equiposApi'
import {
  estadoPartidoApiAUi,
  formatearFechaDia,
  formatearHora,
  mapaEquiposPorId,
  partidoConNombres,
} from '../../api/mappers'
import { listarPartidos } from '../../api/partidosApi'
import { useTablaPosiciones } from '../../composables/useTablaPosiciones'

type EquipoResumen = {
  nombre: string
  iniciales: string
  colorEscudo: string
}

type Kpi = {
  id: string
  titulo: string
  valor: number
  crecimiento: string
  varianteIcono: 'amarillo' | 'verde'
}

type PartidoReciente = {
  id: string
  fechaTexto: string
  local: EquipoResumen
  visitante: EquipoResumen
  golesLocal: number | null
  golesVisitante: number | null
  estado: 'FINALIZADO' | 'PROGRAMADO' | 'SUSPENDIDO' | 'REPROGRAMADO'
}

type FilaTabla = {
  posicion: number
  equipo: EquipoResumen
  pj: number
  pg: number
  pe: number
  pp: number
  pts: number
}

const fechaPanel = ref('')
const horaPanel = ref('')

const kpis = ref<Kpi[]>([])
const ultimosPartidos = ref<PartidoReciente[]>([])
const { filas, cargarTabla } = useTablaPosiciones()
const tablaResumida = computed<FilaTabla[]>(() => filas.value.slice(0, 8))

function actualizarRelojPanel() {
  const ahora = new Date()
  fechaPanel.value = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(ahora)
  horaPanel.value = `${new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(ahora)} hs`
}

async function cargarDashboard() {
  actualizarRelojPanel()
  const [equipos, partidos] = await Promise.all([listarEquipos(), listarPartidos()])
  const mapa = mapaEquiposPorId(equipos)

  const programados = partidos.filter((p) => p.estado === 'Pendiente').length
  const jugados = partidos.filter((p) => p.estado === 'Jugado').length

  kpis.value = [
    {
      id: 'equipos',
      titulo: 'Equipos registrados',
      valor: equipos.length,
      crecimiento: 'Total en la liga',
      varianteIcono: 'amarillo',
    },
    {
      id: 'programados',
      titulo: 'Partidos programados',
      valor: programados,
      crecimiento: 'Estado pendiente',
      varianteIcono: 'verde',
    },
    {
      id: 'jugados',
      titulo: 'Partidos jugados',
      valor: jugados,
      crecimiento: 'Con resultado',
      varianteIcono: 'verde',
    },
  ]

  ultimosPartidos.value = [...partidos]
    .sort(
      (a, b) =>
        new Date(b.fecha_hora ?? 0).getTime() - new Date(a.fecha_hora ?? 0).getTime(),
    )
    .slice(0, 5)
    .map((partido) => {
      const { local, visitante } = partidoConNombres(partido, mapa)
      const estadoUi = estadoPartidoApiAUi(partido.estado)
      return {
        id: String(partido.id),
        fechaTexto: `${formatearFechaDia(partido.fecha_hora)} ${formatearHora(partido.fecha_hora)}`,
        local,
        visitante,
        golesLocal: partido.goles_local,
        golesVisitante: partido.goles_visitante,
        estado:
          estadoUi === 'FINALIZADO'
            ? 'FINALIZADO'
            : estadoUi === 'SUSPENDIDO'
              ? 'SUSPENDIDO'
              : estadoUi === 'REPROGRAMADO'
                ? 'REPROGRAMADO'
                : 'PROGRAMADO',
      }
    })

  await cargarTabla()
}

onMounted(() => {
  cargarDashboard().catch(() => {
    window.alert('No se pudo cargar el panel de inicio.')
  })
})

function colorTextoEscudo(colorEscudo: string): string {
  return colorEscudo === '#e2e8f0' || colorEscudo === '#f8fafc' ? '#0f172a' : 'white'
}

function clasesPosicion(posicion: number): string {
  if (posicion <= 4) return 'bg-green-600/25 text-green-400'
  if (posicion <= 6) return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-red-600/25 text-red-400'
}

function clasesBadgeEstado(estado: PartidoReciente['estado']): string {
  if (estado === 'FINALIZADO') {
    return 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30'
  }
  if (estado === 'SUSPENDIDO') {
    return 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
  }
  if (estado === 'REPROGRAMADO') {
    return 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30'
  }
  return 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30'
}

function textoResultado(partido: PartidoReciente): string {
  if (partido.golesLocal === null || partido.golesVisitante === null) {
    return '-'
  }
  return `${partido.golesLocal} - ${partido.golesVisitante}`
}

function clasesIconoKpi(variante: Kpi['varianteIcono']): string {
  return variante === 'amarillo'
    ? 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/25'
    : 'bg-green-500/15 text-green-400 ring-1 ring-green-500/25'
}
</script>

<template>
  <div class="mx-auto max-w-[90rem] space-y-8">
    <!-- Bienvenida -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          ¡Bienvenido,
          <span class="text-yellow-400">Administrador!</span>
        </h2>
        <p class="mt-2 max-w-xl text-sm text-zinc-400 sm:text-base">
          Desde aquí podés gestionar toda la información de la liga.
        </p>
      </div>

      <div
        class="flex shrink-0 items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 backdrop-blur-sm"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/80 text-yellow-400"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            class="h-5 w-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
            />
          </svg>
        </span>
        <div class="text-sm">
          <p class="font-medium text-white">{{ fechaPanel }}</p>
          <p class="text-zinc-400">{{ horaPanel }}</p>
        </div>
      </div>
    </header>

    <!-- KPIs -->
    <section
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="Indicadores del panel"
    >
      <article
        v-for="kpi in kpis"
        :key="kpi.id"
        class="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm"
      >
        <div class="flex items-start gap-4">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            :class="clasesIconoKpi(kpi.varianteIcono)"
            aria-hidden="true"
          >
            <svg
              v-if="kpi.id === 'equipos'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              class="h-5 w-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11ZM8 13c1.657 0 3-1.567 3-3.5S9.657 6 8 6 5 7.567 5 9.5 7.343 13 8 13Zm8 2c-2.21 0-4 1.343-4 3v1h8v-1c0-1.657-1.79-3-4-3ZM8 15c-2.21 0-4 1.343-4 3v1h8v-1c0-1.657-1.79-3-4-3Z"
              />
            </svg>
            <svg
              v-else-if="kpi.id === 'programados'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              class="h-5 w-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
              />
            </svg>
            <svg
              v-else-if="kpi.id === 'jugados'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              class="h-5 w-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              class="h-5 w-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 5h12a1 1 0 0 1 1 1v13l-3-2-3 2-3-2-3 2-3-2V6a1 1 0 0 1 1-1Z"
              />
              <path stroke-linecap="round" d="M8 9h8M8 13h5" />
            </svg>
          </span>

          <div class="min-w-0 flex-1">
            <p class="text-sm text-zinc-400">{{ kpi.titulo }}</p>
            <p class="mt-1 text-3xl font-bold tabular-nums text-white">{{ kpi.valor }}</p>
            <p class="mt-2 flex items-center gap-1 text-xs font-medium text-green-400">
              <span aria-hidden="true">↑</span>
              {{ kpi.crecimiento }}
            </p>
          </div>
        </div>
      </article>
    </section>

    <!-- Partidos + Tabla -->
    <section class="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <!-- Últimos partidos -->
      <article
        class="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm xl:col-span-7"
      >
        <header
          class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-5 py-4"
        >
          <h3 class="flex items-center gap-2 text-base font-semibold text-white">
            <span class="text-yellow-400" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                class="h-5 w-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 21h8M12 17v4M7 4h10l1 7H6l1-7Zm1 7a4 4 0 0 0 8 0"
                />
              </svg>
            </span>
            Últimos partidos
          </h3>
          <RouterLink
            to="/admin/partidos"
            class="text-sm font-medium text-yellow-400 transition-colors hover:text-yellow-300"
          >
            Ver todos los partidos →
          </RouterLink>
        </header>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr
                class="border-b border-zinc-800/80 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase"
              >
                <th class="px-5 py-3">Fecha</th>
                <th class="px-3 py-3">Equipos</th>
                <th class="px-3 py-3 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="partido in ultimosPartidos"
                :key="partido.id"
                class="border-b border-zinc-800/60 transition-colors last:border-b-0 hover:bg-zinc-800/30"
              >
                <td class="px-5 py-3.5 whitespace-nowrap text-zinc-400 tabular-nums">
                  {{ partido.fechaTexto }}
                </td>
                <td class="px-3 py-3.5">
                  <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div class="flex min-w-0 items-center gap-2">
                      <svg class="h-7 w-7 shrink-0" viewBox="0 0 44 44" aria-hidden="true">
                        <circle
                          cx="22"
                          cy="22"
                          r="20"
                          :fill="partido.local.colorEscudo"
                          stroke="rgba(255,255,255,0.12)"
                          stroke-width="1.5"
                        />
                        <text
                          x="22"
                          y="22"
                          text-anchor="middle"
                          dominant-baseline="central"
                          :fill="colorTextoEscudo(partido.local.colorEscudo)"
                          font-size="9"
                          font-weight="700"
                          font-family="system-ui, sans-serif"
                        >
                          {{ partido.local.iniciales }}
                        </text>
                      </svg>
                      <span class="truncate text-white">{{ partido.local.nombre }}</span>
                    </div>
                    <span class="font-bold text-yellow-400 tabular-nums">
                      {{ textoResultado(partido) }}
                    </span>
                    <div class="flex min-w-0 items-center gap-2">
                      <svg class="h-7 w-7 shrink-0" viewBox="0 0 44 44" aria-hidden="true">
                        <circle
                          cx="22"
                          cy="22"
                          r="20"
                          :fill="partido.visitante.colorEscudo"
                          stroke="rgba(255,255,255,0.12)"
                          stroke-width="1.5"
                        />
                        <text
                          x="22"
                          y="22"
                          text-anchor="middle"
                          dominant-baseline="central"
                          :fill="colorTextoEscudo(partido.visitante.colorEscudo)"
                          font-size="9"
                          font-weight="700"
                          font-family="system-ui, sans-serif"
                        >
                          {{ partido.visitante.iniciales }}
                        </text>
                      </svg>
                      <span class="truncate text-white">{{ partido.visitante.nombre }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3.5 text-right">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase"
                    :class="clasesBadgeEstado(partido.estado)"
                  >
                    {{ partido.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <!-- Tabla de posiciones -->
      <article
        class="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm xl:col-span-5"
      >
        <header
          class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-5 py-4"
        >
          <h3 class="flex items-center gap-2 text-base font-semibold text-white">
            <span class="text-sky-400" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                class="h-5 w-5"
              >
                <path stroke-linecap="round" d="M4 19V5M4 19h16M8 19V9M12 19V7M16 19v-4" />
              </svg>
            </span>
            Tabla de posiciones
          </h3>
          <RouterLink
            to="/admin/tabla"
            class="text-sm font-medium text-yellow-400 transition-colors hover:text-yellow-300"
          >
            Ver tabla completa →
          </RouterLink>
        </header>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[420px] text-sm">
            <thead>
              <tr
                class="border-b border-zinc-800/80 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase"
              >
                <th class="w-10 px-4 py-3">#</th>
                <th class="px-2 py-3">Equipo</th>
                <th class="px-1 py-3 text-center">PJ</th>
                <th class="px-1 py-3 text-center">PG</th>
                <th class="px-1 py-3 text-center">PE</th>
                <th class="px-1 py-3 text-center">PP</th>
                <th class="px-2 py-3 text-center">PTS</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fila in tablaResumida"
                :key="fila.equipo_id"
                class="border-b border-zinc-800/60 transition-colors last:border-b-0 hover:bg-zinc-800/30"
              >
                <td class="px-4 py-2.5">
                  <span
                    class="inline-flex h-6 min-w-6 items-center justify-center rounded px-1 text-[11px] font-bold tabular-nums"
                    :class="clasesPosicion(fila.posicion)"
                  >
                    {{ fila.posicion }}
                  </span>
                </td>
                <td class="px-2 py-2.5">
                  <div class="flex items-center gap-2">
                    <svg class="h-7 w-7 shrink-0" viewBox="0 0 44 44" aria-hidden="true">
                      <circle
                        cx="22"
                        cy="22"
                        r="20"
                        :fill="fila.equipo.colorEscudo"
                        stroke="rgba(255,255,255,0.12)"
                        stroke-width="1.5"
                      />
                      <text
                        x="22"
                        y="22"
                        text-anchor="middle"
                        dominant-baseline="central"
                        :fill="colorTextoEscudo(fila.equipo.colorEscudo)"
                        font-size="9"
                        font-weight="700"
                        font-family="system-ui, sans-serif"
                      >
                        {{ fila.equipo.iniciales }}
                      </text>
                    </svg>
                    <span class="truncate font-medium text-white">{{ fila.equipo.nombre }}</span>
                  </div>
                </td>
                <td class="px-1 py-2.5 text-center tabular-nums text-zinc-400">{{ fila.pj }}</td>
                <td class="px-1 py-2.5 text-center tabular-nums text-zinc-400">{{ fila.pg }}</td>
                <td class="px-1 py-2.5 text-center tabular-nums text-zinc-400">{{ fila.pe }}</td>
                <td class="px-1 py-2.5 text-center tabular-nums text-zinc-400">{{ fila.pp }}</td>
                <td class="px-2 py-2.5 text-center font-bold tabular-nums text-lime-400">
                  {{ fila.pts }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <!-- Accesos rápidos -->
    <section
      class="grid grid-cols-1 gap-4 sm:grid-cols-2"
      aria-label="Accesos rápidos"
    >
      <article
        class="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60"
      >
        <div
          class="absolute inset-0 bg-cover bg-center"
          :style="{ backgroundImage: `url(${estadioUrl})` }"
          aria-hidden="true"
        />
        <div class="absolute inset-0 bg-zinc-950/80" aria-hidden="true" />
        <div class="relative flex min-h-[220px] flex-col justify-end p-5">
          <p class="text-xs font-medium tracking-wide text-zinc-400 uppercase">
            Gestión de equipos
          </p>
          <p class="mt-1 text-sm text-zinc-300">Equipos registrados: <strong class="text-white">16</strong></p>
          <RouterLink
            to="/admin/equipos"
            class="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-3 text-sm font-extrabold tracking-wide text-black uppercase shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105"
          >
            Gestionar equipos
          </RouterLink>
        </div>
      </article>

      <article
        class="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60"
      >
        <div
          class="absolute inset-0 bg-cover bg-top"
          :style="{ backgroundImage: `url(${estadioUrl})` }"
          aria-hidden="true"
        />
        <div class="absolute inset-0 bg-zinc-950/82" aria-hidden="true" />
        <div class="relative flex min-h-[220px] flex-col justify-end p-5">
          <p class="text-xs font-medium tracking-wide text-zinc-400 uppercase">
            Gestión de partidos
          </p>
          <p class="mt-1 text-sm text-zinc-300">
            Partidos programados: <strong class="text-white">32</strong>
          </p>
          <RouterLink
            to="/admin/partidos"
            class="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#ffe566] via-[#f5c518] to-[#d4920a] px-4 py-3 text-sm font-extrabold tracking-wide text-black uppercase shadow-lg shadow-yellow-500/20 transition-[filter] hover:brightness-105"
          >
            Crear partido
          </RouterLink>
        </div>
      </article>
    </section>
  </div>
</template>
