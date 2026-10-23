import { ref } from 'vue'
import { obtenerTorneoActivo } from '../api/torneosApi'
import type { TorneoApi } from '../api/tipos'

const torneoActivo = ref<TorneoApi | null>(null)
const cargando = ref(false)

export function useTorneoActivo() {
  async function cargarTorneoActivo(): Promise<TorneoApi | null> {
    if (torneoActivo.value) return torneoActivo.value
    cargando.value = true
    try {
      torneoActivo.value = await obtenerTorneoActivo()
      return torneoActivo.value
    } finally {
      cargando.value = false
    }
  }

  return { torneoActivo, cargando, cargarTorneoActivo }
}
