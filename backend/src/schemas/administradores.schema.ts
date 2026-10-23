import { z } from "zod";

export const esquemaCrearAdministrador = z.object({
  usuario: z.string().trim().min(1, "El usuario es obligatorio").max(50),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72),
});

export const esquemaLoginAdministrador = z.object({
  usuario: z.string().trim().min(1, "El usuario es obligatorio").max(50),
  password: z.string().min(1, "La contraseña es obligatoria").max(72),
});

export const esquemaActualizarAdministrador = z
  .object({
    usuario: z.string().trim().min(1).max(50).optional(),
    password: z.string().min(6).max(72).optional(),
  })
  .refine(
    (datos) => datos.usuario !== undefined || datos.password !== undefined,
    { message: "Debe enviar al menos un campo para actualizar" }
  );

export const esquemaIdAdministrador = z.coerce
  .number()
  .int("El id debe ser un entero")
  .positive("El id debe ser mayor a cero");

export type DatosCrearAdministrador = z.infer<typeof esquemaCrearAdministrador>;
export type DatosActualizarAdministrador = z.infer<typeof esquemaActualizarAdministrador>;
