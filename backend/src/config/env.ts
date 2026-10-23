import { z } from "zod";

const esquemaEnv = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().int().positive().default(3308),
    DB_USER: z.string().default("root"),
    DB_PASSWORD: z.string().default("root"),
    DB_NAME: z.string().default("liga_futbol"),
    JWT_SECRET: z.string().optional(),
    JWT_EXPIRES_IN: z.string().default("8h"),
    FRONTEND_URL: z.string().url().optional(),
    ALLOW_ADMIN_SEED: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.NODE_ENV === "production") {
      if (!datos.JWT_SECRET || datos.JWT_SECRET.length < 16) {
        ctx.addIssue({
          code: "custom",
          message: "JWT_SECRET es obligatorio en producción (mín. 16 caracteres)",
          path: ["JWT_SECRET"],
        });
      }
      if (!datos.FRONTEND_URL) {
        ctx.addIssue({
          code: "custom",
          message: "FRONTEND_URL es obligatorio en producción",
          path: ["FRONTEND_URL"],
        });
      }
    }
  });

const parseado = esquemaEnv.safeParse(process.env);

if (!parseado.success) {
  console.error("Variables de entorno inválidas:", parseado.error.flatten().fieldErrors);
  process.exit(1);
}

const datos = parseado.data;

const jwtSecret =
  datos.JWT_SECRET ??
  (datos.NODE_ENV === "production"
    ? ""
    : "dev-jwt-secret-cambiar-en-produccion");

export const env = {
  ...datos,
  JWT_SECRET: jwtSecret,
  FRONTEND_URL:
    datos.FRONTEND_URL ??
    (datos.NODE_ENV === "production" ? "" : "http://localhost:5173"),
};
