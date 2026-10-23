import { asegurarCloudinaryConfigurado, cloudinary } from "../config/cloudinary.js";

export async function subirEscudoEquipo(
  buffer: Buffer,
  equipoId: number,
  mimeType: string
): Promise<string> {
  asegurarCloudinaryConfigurado();

  const formato =
    mimeType === "image/svg+xml"
      ? "svg"
      : mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";

  const resultado = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "plu/escudos",
        public_id: `equipo-${equipoId}`,
        overwrite: true,
        resource_type: "image",
        format: formato,
      },
      (error, uploadResult) => {
        if (error || !uploadResult?.secure_url) {
          reject(error ?? new Error("No se pudo subir el escudo"));
          return;
        }
        resolve({ secure_url: uploadResult.secure_url });
      }
    );
    stream.end(buffer);
  });

  return resultado.secure_url;
}
