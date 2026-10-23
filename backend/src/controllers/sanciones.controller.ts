import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
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
