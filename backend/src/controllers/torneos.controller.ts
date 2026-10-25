import type { Request, Response } from "express";
import { ZodError } from "zod";
import { esquemaIdEquipo } from "../schemas/equipos.schema.js";
import {
  esquemaActualizarTorneo,
  esquemaCrearTorneo,
  esquemaIdTorneo,
  esquemaInscribirEquipoTorneo,
  esquemaReemplazarEquipoTorneo,
} from "../schemas/torneos.schema.js";
import * as torneoEquiposService from "../services/torneoEquipos.service.js";
import * as torneosService from "../services/torneos.service.js";

function responderErrorValidacion(res: Response, error: ZodError): void {
  res.status(400).json({
    mensaje: "Datos inválidos",
    errores: error.flatten().fieldErrors,
  });
}

function parsearIdParam(req: Request, res: Response): number | null {
  const resultado = esquemaIdTorneo.safeParse(req.params.id);
  if (!resultado.success) {
    responderErrorValidacion(res, resultado.error);
    return null;
  }
  return resultado.data;
}

export async function listarTorneos(_req: Request, res: Response): Promise<void> {
  try {
    const torneos = await torneosService.listarTorneos();
    res.json(torneos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar torneos" });
  }
}

export async function obtenerTorneoActivo(_req: Request, res: Response): Promise<void> {
  try {
    const torneo = await torneosService.obtenerTorneoActivo();
    if (!torneo) {
      res.status(404).json({ mensaje: "No hay torneo activo" });
      return;
    }
    res.json(torneo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el torneo activo" });
  }
}

export async function listarEquiposTorneo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const torneo = await torneosService.obtenerTorneoPorId(id);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }
    const equipos = await torneoEquiposService.listarEquiposEnTorneo(id);
    res.json(equipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar equipos del torneo" });
  }
}

export async function obtenerTablaTorneo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const torneo = await torneosService.obtenerTorneoPorId(id);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }
    const incluirRetirados =
      req.query.incluir_retirados === "1" || req.query.incluir_retirados === "true";
    const tabla = await torneosService.obtenerTablaPosiciones(id, {
      incluirRetirados,
    });
    res.json(tabla);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener la tabla de posiciones" });
  }
}

export async function obtenerTorneoPorId(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const torneo = await torneosService.obtenerTorneoPorId(id);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }
    res.json(torneo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el torneo" });
  }
}

export async function crearTorneo(req: Request, res: Response): Promise<void> {
  const parseo = esquemaCrearTorneo.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const torneo = await torneosService.crearTorneo(parseo.data);
    res.status(201).json(torneo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear el torneo" });
  }
}

export async function actualizarTorneo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  const parseo = esquemaActualizarTorneo.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const torneo = await torneosService.actualizarTorneo(id, parseo.data);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }
    res.json(torneo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el torneo" });
  }
}

export async function retirarEquipoDeTorneo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  const parseoEquipo = esquemaIdEquipo.safeParse(req.params.equipoId);
  if (!parseoEquipo.success) {
    responderErrorValidacion(res, parseoEquipo.error);
    return;
  }

  try {
    const torneo = await torneosService.obtenerTorneoPorId(id);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }

    const retirado = await torneoEquiposService.retirarEquipoDeTorneo(
      id,
      parseoEquipo.data
    );
    if (!retirado) {
      res.status(404).json({ mensaje: "El equipo no está inscripto activo en este torneo" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al retirar el equipo del torneo" });
  }
}

export async function inscribirEquipoEnTorneo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  const parseo = esquemaInscribirEquipoTorneo.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const torneo = await torneosService.obtenerTorneoPorId(id);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }

    const inscripcion = await torneoEquiposService.inscribirEquipoEnTorneo(
      id,
      parseo.data.equipo_id,
      parseo.data.joined_from_round
    );
    res.status(201).json(inscripcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al inscribir el equipo en el torneo" });
  }
}

export async function reemplazarEquipoEnTorneo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  const parseo = esquemaReemplazarEquipoTorneo.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const resultado = await torneoEquiposService.reemplazarEquipoEnTorneo(
      id,
      parseo.data.equipo_saliente_id,
      parseo.data.equipo_entrante_id,
      parseo.data.jornada_retiro
    );
    res.json(resultado);
  } catch (error) {
    if (error instanceof torneoEquiposService.ErrorReemplazoEquipo) {
      res.status(400).json({ mensaje: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ mensaje: "Error al reemplazar el equipo en el torneo" });
  }
}

export async function eliminarTorneo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const eliminado = await torneosService.eliminarTorneo(id);
    if (!eliminado) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar el torneo" });
  }
}
