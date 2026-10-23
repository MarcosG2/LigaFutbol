import multer from "multer";

const TAMANO_MAX_BYTES = 2 * 1024 * 1024;
const MIME_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

export const subirEscudo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAX_BYTES },
  fileFilter(_req, archivo, callback) {
    if (MIME_PERMITIDOS.has(archivo.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new Error("Formato de escudo no permitido"));
  },
}).single("escudo");
