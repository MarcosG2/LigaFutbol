const LADO_SALIDA_PX = 512

/**
 * Recorta el escudo en un cuadrado (equivalente a object-fit: cover + object-position).
 * Así el encuadre elegido en el admin se guarda en la imagen subida.
 */
export async function encuadrarImagenEscudo(
  archivo: File,
  focoX: number,
  focoY: number,
): Promise<File> {
  if (archivo.type === 'image/svg+xml') {
    return archivo
  }

  let bitmap: ImageBitmap | null = null

  try {
    bitmap = await createImageBitmap(archivo)
    const canvas = document.createElement('canvas')
    canvas.width = LADO_SALIDA_PX
    canvas.height = LADO_SALIDA_PX

    const contexto = canvas.getContext('2d')
    if (!contexto) {
      return archivo
    }

    const escala = Math.max(
      LADO_SALIDA_PX / bitmap.width,
      LADO_SALIDA_PX / bitmap.height,
    )
    const ancho = bitmap.width * escala
    const alto = bitmap.height * escala
    const x = (LADO_SALIDA_PX - ancho) * (focoX / 100)
    const y = (LADO_SALIDA_PX - alto) * (focoY / 100)

    contexto.drawImage(bitmap, x, y, ancho, alto)

    const conservarPng = archivo.type === 'image/png'
    const tipoSalida = conservarPng ? 'image/png' : 'image/webp'
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, tipoSalida, conservarPng ? undefined : 0.88)
    })

    if (!blob) {
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
