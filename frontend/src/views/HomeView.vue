<script setup lang="ts">
import { computed, onMounted } from 'vue'
import EscudoEquipo from '../components/EscudoEquipo.vue'
import { estadioUrl } from '../assets/imagenes'
import { useDatosInicio } from '../composables/useDatosInicio'

const {
  partidoDestacado,
  proximosPartidos,
  numeroProximaFecha,
  resultadosRecientes,
  tablaResumen,
  cargarDatosInicio,
} = useDatosInicio()

const tablaPosiciones = computed(() => tablaResumen.value.slice(0, 8))
const ultimosResultados = resultadosRecientes

onMounted(() => {
  cargarDatosInicio()
})
</script>

<template>
  <div class="bg-slate-950">
    <!-- Hero -->
    <section
      class="relative overflow-hidden border-b border-slate-800 bg-slate-950 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${estadioUrl})` }"
    >
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.15),transparent_50%),linear-gradient(to_right,rgba(2,6,23,0.92),rgba(2,6,23,0.55)_45%,rgba(2,6,23,0.75))]"
        aria-hidden="true"
      />

      <div
        class="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-20"
      >
        <div class="space-y-6">
          <p
            class="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-yellow-400 uppercase"
          >
            <span aria-hidden="true">★</span>
            Pro League Universitaria
          </p>

          <h1
            class="max-w-xl text-4xl leading-[0.95] font-black tracking-tight text-white uppercase italic sm:text-5xl lg:text-6xl"
          >
            La Liga
            <span class="block text-white/95">Universitaria</span>
          </h1>

          <p class="max-w-md text-lg text-white/80 italic">
            Pasión, competencia y comunidad.
          </p>

          <div class="flex flex-wrap gap-3 pt-2">
            <RouterLink
              to="/tabla"
              class="inline-flex items-center gap-2 rounded-md bg-yellow-400 px-5 py-3 text-sm font-bold tracking-wide text-black uppercase transition-colors hover:bg-yellow-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M12 5c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 3a1 1 0 0 0-.8 1.6l2.2 2.9-.6.8a1 1 0 1 0 1.6 1.2l1-1.3a1 1 0 0 0-.1-1.3l-2.5-3.3A1 1 0 0 0 12 10z"
                />
              </svg>
              Ver tabla
            </RouterLink>
            <RouterLink
              to="/fixture"
              class="inline-flex items-center gap-2 rounded-md border border-yellow-400/80 bg-transparent px-5 py-3 text-sm font-bold tracking-wide text-yellow-400 uppercase transition-colors hover:bg-yellow-400/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm13 8H4v10h16V10zM9 12h2v2H9v-2zm4 0h2v2h-2v-2z"
                />
              </svg>
              Próximos partidos
            </RouterLink>
          </div>
        </div>

        <aside
          v-if="partidoDestacado"
          class="rounded-xl border border-yellow-400/40 bg-slate-900/80 p-5 shadow-2xl shadow-black/50 backdrop-blur-sm lg:ml-auto lg:max-w-md lg:w-full"
        >
          <p
            class="mb-5 text-center text-xs font-bold tracking-[0.2em] text-yellow-400 uppercase"
          >
            Partido destacado
          </p>

          <div class="flex items-center justify-between gap-3">
            <div class="flex flex-1 flex-col items-center gap-2 text-center">
              <EscudoEquipo
                :escudo-url="partidoDestacado.local.escudoUrl"
                :iniciales="partidoDestacado.local.iniciales"
                :color-escudo="partidoDestacado.local.colorEscudo"
                :nombre="partidoDestacado.local.nombre"
                tamano="lg"
                forma="circulo"
              />
              <span class="text-xs font-semibold text-white uppercase">
                {{ partidoDestacado.local.nombre }}
              </span>
            </div>

            <span
              class="text-3xl font-black tracking-tighter text-yellow-400 italic"
              >VS</span
            >

            <div class="flex flex-1 flex-col items-center gap-2 text-center">
              <EscudoEquipo
                :escudo-url="partidoDestacado.visitante.escudoUrl"
                :iniciales="partidoDestacado.visitante.iniciales"
                :color-escudo="partidoDestacado.visitante.colorEscudo"
                :nombre="partidoDestacado.visitante.nombre"
                tamano="lg"
                forma="circulo"
              />
              <span class="text-xs font-semibold text-white uppercase">
                {{ partidoDestacado.visitante.nombre }}
              </span>
            </div>
          </div>

          <div
            class="mt-5 flex flex-col items-center gap-3 border-t border-slate-700 pt-4 text-xs font-semibold tracking-wide text-white/90 uppercase sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span class="inline-flex items-center gap-2 text-yellow-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm13 8H4v10h16V10z"
                />
              </svg>
              Fecha {{ partidoDestacado.fechaNumero }}
            </span>
            <span class="inline-flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-4 w-4 text-yellow-400"
                aria-hidden="true"
              >
                <path
                  d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 5v4.3l3.2 1.9-.9 1.5L11 13V7h2z"
                />
              </svg>
              {{ partidoDestacado.dia }} • {{ partidoDestacado.hora }}
            </span>
          </div>
        </aside>
      </div>
    </section>

    <!-- Widgets -->
    <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Próxima fecha -->
        <article
          class="flex flex-col overflow-hidden rounded-lg border border-amber-600/30 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(0,0,0,0.8)_inset]"
        >
          <header class="px-4 pt-4 pb-3">
            <div class="flex items-center justify-between gap-2">
              <h2
                class="flex items-center gap-2 text-[13px] font-extrabold tracking-[0.12em] text-white uppercase"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="h-4 w-4 shrink-0 text-[#f5c518]"
                  aria-hidden="true"
                >
                  <path
                    d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm13 8H4v10h16V10z"
                  />
                </svg>
                Próxima fecha
              </h2>
              <span
                v-if="numeroProximaFecha != null"
                class="text-[10px] font-bold tracking-wider text-[#f5c518] uppercase"
              >
                Fecha {{ numeroProximaFecha }}
              </span>
            </div>
            <div
              class="mt-3 h-px bg-gradient-to-r from-[#A3CF43] via-[#A3CF43]/50 to-transparent"
              aria-hidden="true"
            />
          </header>

          <p
            v-if="proximosPartidos.length === 0"
            class="px-4 py-8 text-center text-sm text-zinc-500"
          >
            No hay partidos programados para la próxima fecha.
          </p>

          <ul v-else class="divide-y divide-white/[0.06] px-2">
            <li
              v-for="(partido, indice) in proximosPartidos"
              :key="indice"
              class="flex items-center gap-2 px-2 py-4 sm:gap-3"
            >
              <div
                class="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
              >
                <EscudoEquipo
                  :escudo-url="partido.local.escudoUrl"
                  :iniciales="partido.local.iniciales"
                  :color-escudo="partido.local.colorEscudo"
                  :nombre="partido.local.nombre"
                  tamano="md"
                  forma="circulo"
                />
                <span
                  class="line-clamp-2 text-[10px] font-bold leading-tight text-white uppercase"
                  >{{ partido.local.nombre }}</span
                >
              </div>

              <span
                class="shrink-0 text-sm font-extrabold tracking-tight text-[#A3CF43]"
                >VS</span
              >

              <div
                class="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
              >
                <EscudoEquipo
                  :escudo-url="partido.visitante.escudoUrl"
                  :iniciales="partido.visitante.iniciales"
                  :color-escudo="partido.visitante.colorEscudo"
                  :nombre="partido.visitante.nombre"
                  tamano="md"
                  forma="circulo"
                />
                <span
                  class="line-clamp-2 text-[10px] font-bold leading-tight text-white uppercase"
                  >{{ partido.visitante.nombre }}</span
                >
              </div>

              <div
                class="flex w-[5.5rem] shrink-0 flex-col gap-1.5 border-l border-white/[0.06] pl-2.5 text-[9px] font-semibold leading-snug tracking-wide text-[#f5c518] uppercase"
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

          <footer class="mt-auto border-t border-white/[0.06] px-4 py-3.5">
            <RouterLink
              to="/fixture"
              class="text-[11px] font-extrabold tracking-[0.14em] text-[#A3CF43] uppercase hover:text-[#b8e04f]"
            >
              Ver fixture completo &gt;
            </RouterLink>
          </footer>
        </article>

        <!-- Tabla -->
        <article
          class="flex flex-col overflow-hidden rounded-lg border border-amber-600/30 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(0,0,0,0.8)_inset]"
        >
          <header class="px-4 pt-4 pb-3">
            <div class="flex items-center justify-between gap-2">
              <h2
                class="flex items-center gap-2 text-[13px] font-extrabold tracking-[0.12em] text-white uppercase"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="h-4 w-4 shrink-0 text-[#f5c518]"
                  aria-hidden="true"
                >
                  <path
                    d="M6 3h12v2h1a1 1 0 0 1 1 1v2H4V6a1 1 0 0 1 1-1h1V3zm2 16H7v-2H5v4h14v-4h-2v2h-1v-5H8v5zm2-14h8V4H8v1zM6 9v8h12V9H6zm2 2h2v4H8v-4zm4 0h4v4h-4v-4z"
                  />
                </svg>
                Tabla de posiciones
              </h2>
              <span
                class="text-[10px] font-bold tracking-wider text-[#f5c518] uppercase"
                >Fecha 12</span
              >
            </div>
            <div
              class="mt-3 h-px bg-gradient-to-r from-[#A3CF43] via-[#A3CF43]/50 to-transparent"
              aria-hidden="true"
            />
          </header>

          <div class="overflow-x-auto px-1 pb-1">
            <table class="w-full min-w-[280px] text-left text-[11px]">
              <thead>
                <tr
                  class="text-[9px] font-bold tracking-[0.14em] text-slate-500 uppercase"
                >
                  <th class="px-2 py-2 w-8">#</th>
                  <th class="px-1 py-2">Equipo</th>
                  <th class="px-1 py-2 text-center">PJ</th>
                  <th class="px-1 py-2 text-center">PG</th>
                  <th class="px-1 py-2 text-center">PE</th>
                  <th class="px-1 py-2 text-center">PP</th>
                  <th class="px-2 py-2 text-center text-[#A3CF43]">PTS</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="fila in tablaPosiciones"
                  :key="fila.equipo_id"
                  class="border-t border-white/[0.05]"
                >
                  <td class="px-2 py-2">
                    <span
                      class="inline-flex h-5 min-w-5 items-center justify-center bg-[#A3CF43] px-0.5 text-[10px] font-extrabold text-[#0a0a0a]"
                    >
                      {{ fila.posicion }}
                    </span>
                  </td>
                  <td class="px-1 py-2">
                    <div class="flex items-center gap-2">
                      <EscudoEquipo
                        :escudo-url="fila.equipo.escudoUrl"
                        :iniciales="fila.equipo.iniciales"
                        :color-escudo="fila.equipo.colorEscudo"
                        :nombre="fila.equipo.nombre"
                        tamano="sm"
                        forma="circulo"
                      />
                      <span
                        class="font-bold text-[10px] text-white uppercase"
                        >{{ fila.equipo.nombre }}</span
                      >
                    </div>
                  </td>
                  <td class="px-1 py-2 text-center text-slate-400">
                    {{ fila.pj }}
                  </td>
                  <td class="px-1 py-2 text-center text-slate-400">
                    {{ fila.pg }}
                  </td>
                  <td class="px-1 py-2 text-center text-slate-400">
                    {{ fila.pe }}
                  </td>
                  <td class="px-1 py-2 text-center text-slate-400">
                    {{ fila.pp }}
                  </td>
                  <td
                    class="px-2 py-2 text-center text-sm font-extrabold text-[#A3CF43] tabular-nums"
                  >
                    {{ fila.pts }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer class="mt-auto border-t border-white/[0.06] px-4 py-3.5">
            <RouterLink
              to="/tabla"
              class="text-[11px] font-extrabold tracking-[0.14em] text-[#A3CF43] uppercase hover:text-[#b8e04f]"
            >
              Ver tabla completa &gt;
            </RouterLink>
          </footer>
        </article>

        <!-- Últimos resultados -->
        <article
          class="flex flex-col overflow-hidden rounded-lg border border-amber-600/30 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(0,0,0,0.8)_inset]"
        >
          <header class="px-4 pt-4 pb-3">
            <div class="flex items-center justify-between gap-2">
              <h2
                class="flex items-center gap-2 text-[13px] font-extrabold tracking-[0.12em] text-white uppercase"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="h-4 w-4 shrink-0 text-[#f5c518]"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 4v5h4v2h-6V6h2z"
                  />
                </svg>
                Últimos resultados
              </h2>
              <span
                class="text-[10px] font-bold tracking-wider text-[#f5c518] uppercase"
                >Fecha 12</span
              >
            </div>
            <div
              class="mt-3 h-px bg-gradient-to-r from-[#A3CF43] via-[#A3CF43]/50 to-transparent"
              aria-hidden="true"
            />
          </header>

          <ul class="divide-y divide-white/[0.06]">
            <li
              v-for="(resultado, indice) in ultimosResultados"
              :key="indice"
              class="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 py-3.5 sm:flex-nowrap"
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
                <span
                  class="truncate font-bold text-white uppercase"
                  >{{ resultado.local.nombre }}</span
                >
              </div>

              <span
                class="shrink-0 px-1 text-base font-extrabold text-[#A3CF43] tabular-nums"
              >
                {{ resultado.golesLocal }} - {{ resultado.golesVisitante }}
              </span>

              <div
                class="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right text-[10px]"
              >
                <span
                  class="truncate font-bold text-white uppercase"
                  >{{ resultado.visitante.nombre }}</span
                >
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
                <span
                  class="text-[8px] font-semibold tracking-wide text-slate-500 uppercase"
                >
                  {{ resultado.fecha }}
                </span>
                <span
                  class="rounded-sm bg-[#A3CF43] px-1.5 py-0.5 text-[8px] font-extrabold tracking-wider text-[#0a0a0a] uppercase"
                >
                  Final
                </span>
              </div>
            </li>
          </ul>

          <footer class="mt-auto border-t border-white/[0.06] px-4 py-3.5">
            <RouterLink
              to="/fixture"
              class="text-[11px] font-extrabold tracking-[0.14em] text-[#A3CF43] uppercase hover:text-[#b8e04f]"
            >
              Ver todos los resultados &gt;
            </RouterLink>
          </footer>
        </article>
      </div>
    </section>
  </div>
</template>
