import type { AdministradorPublico } from './tipos'

const CLAVE_SESION = 'liga-admin-sesion'
const CLAVE_TOKEN = 'liga-admin-token'

export function obtenerToken(): string | null {
  return sessionStorage.getItem(CLAVE_TOKEN)
}

export function guardarSesion(token: string, administrador: AdministradorPublico): void {
  sessionStorage.setItem(CLAVE_TOKEN, token)
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(administrador))
}

export function obtenerSesion(): AdministradorPublico | null {
  try {
    const raw = sessionStorage.getItem(CLAVE_SESION)
    if (!raw) return null
    return JSON.parse(raw) as AdministradorPublico
  } catch {
    return null
  }
}

export function cerrarSesion(): void {
  sessionStorage.removeItem(CLAVE_TOKEN)
  sessionStorage.removeItem(CLAVE_SESION)
}

export function haySesionActiva(): boolean {
  return obtenerToken() !== null && obtenerSesion() !== null
}
