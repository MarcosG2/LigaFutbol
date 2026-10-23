import { z } from "zod";

const estadoPartidoEnum = z.enum(["Pendiente", "Jugado", "Suspendido"]);
const enteroPositivo = z.coerce.number().int().positive();

const equiposDistintos = (datos: {
  equipo_local_id: number;
  equipo_visitante_id: number;
}) => datos.equipo_local_id !== datos.equipo_visitante_id;

export const esquemaCrearPartido = z
  .object({
    torneo_id: enteroPositivo,
    numero_fecha: z.number().int().positive().optional().nullable(),
    numero_partido: z.number().int().positive().optional().nullable(),
    equipo_local_id: enteroPositivo,
    equipo_visitante_id: enteroPositivo,
    goles_local: z.number().int().nonnegative().optional().nullable(),
    goles_visitante: z.number().int().nonnegative().optional().nullable(),
    fecha_hora: z.coerce.date().optional().nullable(),
    estado: estadoPartidoEnum.optional().default("Pendiente"),
    destacado_portada: z.boolean().optional().default(false),
  })
  .refine(equiposDistintos, {
    message: "El equipo local y el visitante deben ser distintos",
    path: ["equipo_visitante_id"],
  });

export const esquemaActualizarPartido = z
  .object({
    torneo_id: enteroPositivo.optional(),
    numero_fecha: z.number().int().positive().optional().nullable(),
    numero_partido: z.number().int().positive().optional().nullable(),
    equipo_local_id: enteroPositivo.optional(),
    equipo_visitante_id: enteroPositivo.optional(),
    goles_local: z.number().int().nonnegative().optional().nullable(),
    goles_visitante: z.number().int().nonnegative().optional().nullable(),
    fecha_hora: z.coerce.date().optional().nullable(),
    estado: estadoPartidoEnum.optional(),
    destacado_portada: z.boolean().optional(),
  })
  .refine(
    (datos) =>
      datos.torneo_id !== undefined ||
      datos.numero_fecha !== undefined ||
      datos.numero_partido !== undefined ||
      datos.equipo_local_id !== undefined ||
      datos.equipo_visitante_id !== undefined ||
      datos.goles_local !== undefined ||
      datos.goles_visitante !== undefined ||
      datos.fecha_hora !== undefined ||
      datos.estado !== undefined ||
      datos.destacado_portada !== undefined,
    { message: "Debe enviar al menos un campo para actualizar" }
  )
  .refine(
    (datos) => {
      if (datos.equipo_local_id === undefined || datos.equipo_visitante_id === undefined) {
        return true;
      }
      return equiposDistintos({
        equipo_local_id: datos.equipo_local_id,
        equipo_visitante_id: datos.equipo_visitante_id,
      });
    },
    {
      message: "El equipo local y el visitante deben ser distintos",
      path: ["equipo_visitante_id"],
    }
  );

export const esquemaIdPartido = z.coerce
  .number()
  .int("El id debe ser un entero")
  .positive("El id debe ser mayor a cero");

export type DatosCrearPartido = z.infer<typeof esquemaCrearPartido>;
export type DatosActualizarPartido = z.infer<typeof esquemaActualizarPartido>;
