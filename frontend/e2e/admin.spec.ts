import { expect, test, type Page } from '@playwright/test'

const UMBRAL_RESPUESTA_LOGIN_MS = 10_000
const RUTA_LOGIN = '/administradores/login'

function registrarErroresConsola(page: Page) {
  const erroresConsola: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      erroresConsola.push(msg.text())
    }
  })

  page.on('pageerror', (error) => {
    erroresConsola.push(error.message)
  })

  return erroresConsola
}

function filtrarErroresIgnorables(errores: string[]) {
  return errores.filter(
    (texto) =>
      !/favicon|Failed to load resource.*404|Failed to load resource:.*401 \(Unauthorized\)/i.test(
        texto,
      ),
  )
}

test.describe('Admin — login en producción', () => {
  test('muestra el formulario, rechaza credenciales inválidas y mide la API', async ({
    page,
  }) => {
    const erroresConsola = registrarErroresConsola(page)

    const inicioCarga = Date.now()
    await page.goto(RUTA_LOGIN, { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveTitle(/ProLeague/i)

    const tituloLogin = page.getByRole('heading', {
      name: /Acceso administrador/i,
      level: 1,
    })
    await expect(tituloLogin).toBeVisible()

    const campoEmail = page.getByLabel('Email')
    const campoContrasena = page.getByLabel('Contraseña')
    await expect(campoEmail).toBeVisible()
    await expect(campoContrasena).toBeVisible()

    const duracionCargaMs = Date.now() - inicioCarga
    test.info().annotations.push({
      type: 'performance',
      description: `Carga del formulario de login: ${duracionCargaMs} ms`,
    })

    const respuestaLogin = page.waitForResponse(
      (res) =>
        res.url().includes('/administradores/login') && res.request().method() === 'POST',
    )

    const inicioLogin = Date.now()
    await campoEmail.fill('e2e-invalido@liga.local')
    await campoContrasena.fill('contraseña-invalida-e2e')
    await page.getByRole('button', { name: /Ingresar/i }).click()

    const respuesta = await respuestaLogin
    const duracionLoginMs = Date.now() - inicioLogin

    test.info().annotations.push({
      type: 'performance',
      description: `Respuesta POST /administradores/login: ${duracionLoginMs} ms (HTTP ${respuesta.status()})`,
    })

    expect(respuesta.status()).toBe(401)
    expect(
      duracionLoginMs,
      `El login tardó más de ${UMBRAL_RESPUESTA_LOGIN_MS} ms`,
    ).toBeLessThan(UMBRAL_RESPUESTA_LOGIN_MS)

    await expect(
      page.getByText('Usuario o contraseña incorrectos.'),
    ).toBeVisible()

    const erroresIgnorables = filtrarErroresIgnorables(erroresConsola)
    expect(
      erroresIgnorables,
      `Errores en consola: ${erroresIgnorables.join(' | ')}`,
    ).toEqual([])
  })
})
