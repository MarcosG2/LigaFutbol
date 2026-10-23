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

export { esquemaIdTorneo as esquemaIdTorneoSanciones };

export type DatosRegistrarSancion = z.infer<typeof esquemaRegistrarSancion>;
