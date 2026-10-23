import { z } from "zod";

const estadoTorneoEnum = z.enum(["Activo", "Finalizado"]);

export const esquemaCrearTorneo = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  estado: estadoTorneoEnum.optional().default("Activo"),
});

export const esquemaActualizarTorneo = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    estado: estadoTorneoEnum.optional(),
  })
  .refine(
    (datos) => datos.nombre !== undefined || datos.estado !== undefined,
    { message: "Debe enviar al menos un campo para actualizar" }
  );

export const esquemaIdTorneo = z.coerce
  .number()
  .int("El id debe ser un entero")
  .positive("El id debe ser mayor a cero");

export type DatosCrearTorneo = z.infer<typeof esquemaCrearTorneo>;
export type DatosActualizarTorneo = z.infer<typeof esquemaActualizarTorneo>;
