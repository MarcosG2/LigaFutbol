import { expect, test } from '@playwright/test'

const UMBRAL_CARGA_MS = 15_000

test.describe('Liga — inicio en producción', () => {
  test('carga la home, contenido principal y sin errores graves en consola', async ({
    page,
  }) => {
    const erroresConsola: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        erroresConsola.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      erroresConsola.push(error.message)
    })

    const inicio = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveTitle(/ProLeague/i)

    const encabezadoLiga = page.getByRole('heading', {
      name: /La Liga/i,
      level: 1,
    })
    await expect(encabezadoLiga).toBeVisible()

    const proximaFecha = page.getByRole('heading', { name: /Próxima fecha/i })
    const tablaPosiciones = page.getByRole('heading', {
      name: /Tabla de posiciones/i,
    })

    await expect(proximaFecha).toBeVisible()
    await expect(tablaPosiciones).toBeVisible()

    const articuloProxima = page.locator('article').filter({ has: proximaFecha })
    await expect(
      articuloProxima
        .getByText(/No hay partidos programados/i)
        .or(articuloProxima.locator('ul li').first()),
    ).toBeVisible({ timeout: 20_000 })

    const articuloTabla = page.locator('article').filter({ has: tablaPosiciones })
    await expect(articuloTabla.locator('table tbody tr').first()).toBeVisible({
      timeout: 20_000,
    })

    const duracionMs = Date.now() - inicio
    test.info().annotations.push({
      type: 'performance',
      description: `Carga inicial (DOM + widgets visibles): ${duracionMs} ms`,
    })

    expect(duracionMs, `La home tardó más de ${UMBRAL_CARGA_MS} ms`).toBeLessThan(
      UMBRAL_CARGA_MS,
    )

    const erroresIgnorables = erroresConsola.filter(
      (texto) =>
        !/favicon|Failed to load resource.*404/i.test(texto),
    )
    expect(
      erroresIgnorables,
      `Errores en consola: ${erroresIgnorables.join(' | ')}`,
    ).toEqual([])
  })
})
