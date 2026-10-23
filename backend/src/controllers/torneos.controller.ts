import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  esquemaActualizarTorneo,
  esquemaCrearTorneo,
  esquemaIdTorneo,
} from "../schemas/torneos.schema.js";
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

export async function obtenerTablaTorneo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const torneo = await torneosService.obtenerTorneoPorId(id);
    if (!torneo) {
      res.status(404).json({ mensaje: "Torneo no encontrado" });
      return;
    }
    const tabla = await torneosService.obtenerTablaPosiciones(id);
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
