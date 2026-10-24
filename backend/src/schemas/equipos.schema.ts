import { z } from "zod";

const estadoEquipoEnum = z.enum(["Activo", "Inactivo"]);

const MIN_JUGADORES_PLANTILLA = 11;
const MAX_JUGADORES_PLANTILLA = 28;

export const esquemaJugadorPlantillaEquipo = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  numero_camiseta: z.coerce
    .number()
    .int()
    .positive("El número de camiseta debe ser mayor a cero"),
});

export const esquemaJugadorPlantillaSincronizar = esquemaJugadorPlantillaEquipo.extend({
  id: z.coerce.number().int().positive().optional(),
});

const cadenaOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((valor) => (valor === "" || valor === undefined ? null : valor));

export const esquemaCrearEquipo = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  escudo_url: cadenaOpcional(255),
  instagram: cadenaOpcional(100),
  estado: estadoEquipoEnum.optional().default("Activo"),
  jugadores: z
    .array(esquemaJugadorPlantillaEquipo)
    .min(MIN_JUGADORES_PLANTILLA, `La plantilla requiere al menos ${MIN_JUGADORES_PLANTILLA} jugadores`)
    .max(MAX_JUGADORES_PLANTILLA, `La plantilla no puede superar ${MAX_JUGADORES_PLANTILLA} jugadores`)
    .refine(
      (jugadores) => {
        const dorsales = jugadores.map((j) => j.numero_camiseta);
        return new Set(dorsales).size === dorsales.length;
      },
      { message: "Hay dorsales duplicados en la plantilla" }
    )
    .optional(),
});

export const esquemaActualizarEquipo = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    escudo_url: cadenaOpcional(255),
    instagram: cadenaOpcional(100),
    estado: estadoEquipoEnum.optional(),
  })
  .refine(
    (datos) =>
      datos.nombre !== undefined ||
      datos.escudo_url !== undefined ||
      datos.instagram !== undefined ||
      datos.estado !== undefined,
    { message: "Debe enviar al menos un campo para actualizar" }
  );

const plantillaConDorsalesUnicos = (
  jugadores: { numero_camiseta: number }[]
) => {
  const dorsales = jugadores.map((jugador) => jugador.numero_camiseta);
  return new Set(dorsales).size === dorsales.length;
};

export const esquemaSincronizarPlantilla = z.object({
  jugadores: z
    .array(esquemaJugadorPlantillaSincronizar)
    .min(MIN_JUGADORES_PLANTILLA, `La plantilla requiere al menos ${MIN_JUGADORES_PLANTILLA} jugadores`)
    .max(MAX_JUGADORES_PLANTILLA, `La plantilla no puede superar ${MAX_JUGADORES_PLANTILLA} jugadores`)
    .refine(plantillaConDorsalesUnicos, { message: "Hay dorsales duplicados en la plantilla" })
    .refine(
      (jugadores) => {
        const ids = jugadores.flatMap((jugador) => (jugador.id !== undefined ? [jugador.id] : []));
        return new Set(ids).size === ids.length;
      },
      { message: "Hay jugadores repetidos en la plantilla" }
    ),
});

export const esquemaIdEquipo = z.coerce
  .number()
  .int("El id debe ser un entero")
  .positive("El id debe ser mayor a cero");

export type JugadorPlantillaEquipo = z.infer<typeof esquemaJugadorPlantillaEquipo>;
export type JugadorPlantillaSincronizar = z.infer<typeof esquemaJugadorPlantillaSincronizar>;
export type DatosCrearEquipo = z.infer<typeof esquemaCrearEquipo>;
export type DatosActualizarEquipo = z.infer<typeof esquemaActualizarEquipo>;
export type DatosSincronizarPlantilla = z.infer<typeof esquemaSincronizarPlantilla>;
