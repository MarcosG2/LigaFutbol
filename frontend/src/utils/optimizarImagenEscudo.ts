const LADO_MAXIMO_PX = 512
const CALIDAD_COMPRESION = 0.82

/**
 * Reduce tamaño de escudos raster (JPG/PNG/WEBP) antes de enviarlos al servidor.
 * SVG se envía sin cambios.
 */
export async function optimizarImagenEscudo(archivo: File): Promise<File> {
  if (archivo.type === 'image/svg+xml') {
    return archivo
  }

  if (!archivo.type.startsWith('image/')) {
    return archivo
  }

  let bitmap: ImageBitmap | null = null

  try {
    bitmap = await createImageBitmap(archivo)
    const ladoMayor = Math.max(bitmap.width, bitmap.height)
    const escala = ladoMayor > LADO_MAXIMO_PX ? LADO_MAXIMO_PX / ladoMayor : 1
    const ancho = Math.max(1, Math.round(bitmap.width * escala))
    const alto = Math.max(1, Math.round(bitmap.height * escala))

    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto

    const contexto = canvas.getContext('2d')
    if (!contexto) {
      return archivo
    }

    contexto.drawImage(bitmap, 0, 0, ancho, alto)

    const conservarPng = archivo.type === 'image/png'
    const tipoSalida = conservarPng ? 'image/png' : 'image/webp'
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, tipoSalida, conservarPng ? undefined : CALIDAD_COMPRESION)
    })

    if (!blob || blob.size >= archivo.size) {
      return archivo
    }

    const extension = conservarPng ? 'png' : 'webp'
    const nombreBase = archivo.name.replace(/\.[^.]+$/u, '') || 'escudo'

    return new File([blob], `${nombreBase}.${extension}`, {
      type: tipoSalida,
      lastModified: Date.now(),
    })
  } catch {
    return archivo
  } finally {
    bitmap?.close()
  }
}
