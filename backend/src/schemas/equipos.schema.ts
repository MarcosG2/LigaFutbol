import { z } from "zod";

const estadoEquipoEnum = z.enum(["Activo", "Inactivo"]);

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

export const esquemaIdEquipo = z.coerce
  .number()
  .int("El id debe ser un entero")
  .positive("El id debe ser mayor a cero");

export type DatosCrearEquipo = z.infer<typeof esquemaCrearEquipo>;
export type DatosActualizarEquipo = z.infer<typeof esquemaActualizarEquipo>;
