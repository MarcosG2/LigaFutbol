import { solicitar } from './cliente'
import { cerrarSesion, guardarSesion, haySesionActiva, obtenerSesion } from './sesion'
import type { AdministradorPublico } from './tipos'

export interface RespuestaLogin {
  token: string
  administrador: AdministradorPublico
}

export async function iniciarSesion(usuario: string, password: string): Promise<AdministradorPublico> {
  const respuesta = await solicitar<RespuestaLogin>('/administradores/login', {
    method: 'POST',
    body: { usuario, password },
    omitirAuth: true,
  })
  guardarSesion(respuesta.token, respuesta.administrador)
  return respuesta.administrador
}

export { cerrarSesion, haySesionActiva, obtenerSesion }
