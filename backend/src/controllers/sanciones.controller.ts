import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  esquemaActualizarSancion,
  esquemaIdSancion,
  esquemaIdTorneoSanciones,
  esquemaRegistrarSancion,
} from "../schemas/sanciones.schema.js";
import * as sancionesService from "../services/sanciones.service.js";
import * as torneosService from "../services/torneos.service.js";

function responderErrorValidacion(res: Response, error: ZodError): void {
  res.status(400).json({
    mensaje: "Datos inválidos",
    errores: error.flatten().fieldErrors,
  });
}

export async function listarSancionesTorneo(req: Request, res: Response): Promise<void> {
  const parseoId = esquemaIdTorneoSanciones.safeParse(req.params.id);
  if (!parseoId.success) {
    responderErrorValidacion(res, parseoId.error);
    return;
  }

  const torneoId = parseoId.data;

  try {
    const torneo = await torneosService.obtenerTorneoPorId(torneoId);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }

    const sanciones = await sancionesService.listarSancionesPorTorneo(torneoId);
    res.json(sanciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar sanciones" });
  }
}

function parsearIdsSancion(
  req: Request,
  res: Response
): { torneoId: number; sancionId: number } | null {
  const parseoTorneo = esquemaIdTorneoSanciones.safeParse(req.params.id);
  if (!parseoTorneo.success) {
    responderErrorValidacion(res, parseoTorneo.error);
    return null;
  }

  const parseoSancion = esquemaIdSancion.safeParse(req.params.sancionId);
  if (!parseoSancion.success) {
    responderErrorValidacion(res, parseoSancion.error);
    return null;
  }

  return { torneoId: parseoTorneo.data, sancionId: parseoSancion.data };
}

export async function registrarSancionTorneo(req: Request, res: Response): Promise<void> {
  const parseoId = esquemaIdTorneoSanciones.safeParse(req.params.id);
  if (!parseoId.success) {
    responderErrorValidacion(res, parseoId.error);
    return;
  }

  const parseoCuerpo = esquemaRegistrarSancion.safeParse(req.body);
  if (!parseoCuerpo.success) {
    responderErrorValidacion(res, parseoCuerpo.error);
    return;
  }

  const torneoId = parseoId.data;

  try {
    const torneo = await torneosService.obtenerTorneoPorId(torneoId);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }

    const sancion = await sancionesService.registrarSancion(torneoId, parseoCuerpo.data);
    if (!sancion) {
      res.status(404).json({ mensaje: "Equipo no encontrado" });
      return;
    }

    res.status(201).json(sancion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al registrar la sanción" });
  }
}

export async function actualizarSancionTorneo(req: Request, res: Response): Promise<void> {
  const ids = parsearIdsSancion(req, res);
  if (ids === null) return;

  const parseoCuerpo = esquemaActualizarSancion.safeParse(req.body);
  if (!parseoCuerpo.success) {
    responderErrorValidacion(res, parseoCuerpo.error);
    return;
  }

  try {
    const torneo = await torneosService.obtenerTorneoPorId(ids.torneoId);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }

    const sancion = await sancionesService.actualizarSancion(
      ids.torneoId,
      ids.sancionId,
      parseoCuerpo.data
    );
    if (!sancion) {
      res.status(404).json({ mensaje: "Sanción o equipo no encontrado" });
      return;
    }

    res.json(sancion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar la sanción" });
  }
}

export async function eliminarSancionTorneo(req: Request, res: Response): Promise<void> {
  const ids = parsearIdsSancion(req, res);
  if (ids === null) return;

  try {
    const torneo = await torneosService.obtenerTorneoPorId(ids.torneoId);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }

    const eliminada = await sancionesService.eliminarSancion(ids.torneoId, ids.sancionId);
    if (!eliminada) {
      res.status(404).json({ mensaje: "Sanción no encontrada" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la sanción" });
  }
}
