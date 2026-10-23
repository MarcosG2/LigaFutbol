import { ref } from 'vue'
import { filaTablaConPosicion } from '../api/mappers'
import { obtenerTablaTorneo, obtenerTorneoActivo } from '../api/torneosApi'

export function useTablaPosiciones() {
  const filas = ref<ReturnType<typeof filaTablaConPosicion>>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargarTabla() {
    cargando.value = true
    error.value = null
    try {
      const torneo = await obtenerTorneoActivo()
      if (!torneo) {
        filas.value = []
        return
      }
      const tabla = await obtenerTablaTorneo(torneo.id)
      filas.value = filaTablaConPosicion(tabla)
    } catch {
      error.value = 'No se pudo cargar la tabla de posiciones.'
      filas.value = []
    } finally {
      cargando.value = false
    }
  }

  return { filas, cargando, error, cargarTabla }
}
