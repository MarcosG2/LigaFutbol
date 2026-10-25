import { z } from "zod";
import { esquemaIdTorneo } from "./torneos.schema.js";

export const esquemaRegistrarSancion = z.object({
  equipo_id: z.coerce
    .number()
    .int("El id del equipo debe ser un entero")
    .positive("El id del equipo debe ser mayor a cero"),
  puntos: z.coerce
    .number()
    .int("Los puntos deben ser un entero")
    .positive("Los puntos deben ser mayor a cero"),
  motivo: z.string().trim().min(1, "El motivo es obligatorio").max(500),
});

export const esquemaIdSancion = z.coerce
  .number()
  .int("El id de la sanción debe ser un entero")
  .positive("El id de la sanción debe ser mayor a cero");

export const esquemaActualizarSancion = z
  .object({
    equipo_id: z.coerce
      .number()
      .int("El id del equipo debe ser un entero")
      .positive("El id del equipo debe ser mayor a cero")
      .optional(),
    puntos: z.coerce
      .number()
      .int("Los puntos deben ser un entero")
      .positive("Los puntos deben ser mayor a cero")
      .optional(),
    motivo: z.string().trim().min(1, "El motivo es obligatorio").max(500).optional(),
  })
  .refine(
    (datos) =>
      datos.equipo_id !== undefined ||
      datos.puntos !== undefined ||
      datos.motivo !== undefined,
    { message: "Debe enviar al menos un campo para actualizar" }
  );

export { esquemaIdTorneo as esquemaIdTorneoSanciones };

export type DatosRegistrarSancion = z.infer<typeof esquemaRegistrarSancion>;
export type DatosActualizarSancion = z.infer<typeof esquemaActualizarSancion>;
