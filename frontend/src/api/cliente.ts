import { cerrarSesion, obtenerToken } from './sesion'

const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

export class ErrorApi extends Error {
  status: number
  errores?: Record<string, string[] | undefined>

  constructor(mensaje: string, status: number, errores?: Record<string, string[] | undefined>) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
    this.errores = errores
  }
}

type OpcionesSolicitud = Omit<RequestInit, 'body'> & {
  body?: unknown
  /** No envía Bearer (p. ej. login) */
  omitirAuth?: boolean
}

function manejarNoAutorizado(): void {
  cerrarSesion()
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login')
  }
}

export async function solicitar<T>(ruta: string, opciones: OpcionesSolicitud = {}): Promise<T> {
  const { body, headers, omitirAuth, ...resto } = opciones
  const tieneCuerpo = body !== undefined
  const esFormData = body instanceof FormData
  const token = omitirAuth ? null : obtenerToken()

  const respuesta = await fetch(`${apiBase}${ruta}`, {
    ...resto,
    headers: {
      ...(tieneCuerpo && !esFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: tieneCuerpo
      ? esFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  })

  if (respuesta.status === 204) {
    return undefined as T
  }

  const datos = (await respuesta.json().catch(() => ({}))) as {
    mensaje?: string
    errores?: Record<string, string[] | undefined>
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && !omitirAuth) {
      manejarNoAutorizado()
    }
    throw new ErrorApi(datos.mensaje ?? 'Error en la solicitud', respuesta.status, datos.errores)
  }

  return datos as T
}

export { apiBase }
