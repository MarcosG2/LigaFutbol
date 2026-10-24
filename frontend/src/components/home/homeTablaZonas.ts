/** Posiciones que clasifican a playoffs (alineado con TablaView). */
export const POSICIONES_PLAYOFF = 6

/** Cantidad de equipos en zona de descenso (últimas posiciones). */
export const EQUIPOS_ZONA_DESCENSO = 2

export function clasesFilaTabla(posicion: number, totalEquipos: number): string {
  const enDescenso = totalEquipos > 0 && posicion > totalEquipos - EQUIPOS_ZONA_DESCENSO
  if (posicion === 1) {
    return 'bg-yellow-400/10 hover:bg-yellow-400/15'
  }
  if (posicion <= POSICIONES_PLAYOFF) {
    return 'bg-emerald-500/5 hover:bg-emerald-500/10'
  }
  if (enDescenso) {
    return 'bg-red-500/5 hover:bg-red-500/10'
  }
  return 'hover:bg-white/[0.03]'
}

/** Badges y filas sin resaltar descenso (vista tabla completa). */
export function clasesFilaTablaPublica(posicion: number): string {
  if (posicion === 1) {
    return 'bg-yellow-400/10 hover:bg-yellow-400/15'
  }
  if (posicion <= POSICIONES_PLAYOFF) {
    return 'bg-emerald-500/5 hover:bg-emerald-500/10'
  }
  return 'hover:bg-white/[0.03]'
}

export function clasesBadgePosicionPublica(posicion: number): string {
  if (posicion === 1) {
    return 'bg-yellow-400 text-slate-950 ring-1 ring-yellow-300/50'
  }
  if (posicion <= POSICIONES_PLAYOFF) {
    return 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/30'
  }
  return 'bg-slate-700/80 text-slate-200'
}

export function clasesBadgePosicion(posicion: number, totalEquipos: number): string {
  if (posicion === 1) {
    return 'bg-yellow-400 text-slate-950 ring-1 ring-yellow-300/50'
  }
  if (posicion <= POSICIONES_PLAYOFF) {
    return 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/30'
  }
  if (totalEquipos > 0 && posicion > totalEquipos - EQUIPOS_ZONA_DESCENSO) {
    return 'bg-red-500/25 text-red-300 ring-1 ring-red-500/30'
  }
  return 'bg-slate-700/80 text-slate-200'
}
