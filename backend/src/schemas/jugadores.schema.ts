import { z } from "zod";

const enteroPositivo = z.coerce.number().int().positive();

const enteroOpcionalNullable = z.coerce
  .number()
  .int()
  .nonnegative()
  .optional()
  .nullable();

export const esquemaCrearJugador = z.object({
  equipo_id: enteroPositivo,
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  numero_camiseta: enteroOpcionalNullable,
  goles: z.number().int().nonnegative().optional().nullable().default(null),
});

export const esquemaActualizarJugador = z
  .object({
    equipo_id: enteroPositivo.optional(),
    nombre: z.string().trim().min(1).max(100).optional(),
    numero_camiseta: enteroOpcionalNullable,
    goles: z.number().int().nonnegative().optional().nullable(),
  })
  .refine(
    (datos) =>
      datos.equipo_id !== undefined ||
      datos.nombre !== undefined ||
      datos.numero_camiseta !== undefined ||
      datos.goles !== undefined,
    { message: "Debe enviar al menos un campo para actualizar" }
  );

export const esquemaIdJugador = z.coerce
  .number()
  .int("El id debe ser un entero")
  .positive("El id debe ser mayor a cero");

export const esquemaFiltroListarJugadores = z.object({
  equipo_id: enteroPositivo.optional(),
});

export type DatosCrearJugador = z.infer<typeof esquemaCrearJugador>;
export type DatosActualizarJugador = z.infer<typeof esquemaActualizarJugador>;
