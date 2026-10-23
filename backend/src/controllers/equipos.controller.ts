import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  esquemaActualizarEquipo,
  esquemaCrearEquipo,
  esquemaIdEquipo,
} from "../schemas/equipos.schema.js";
import * as archivosService from "../services/archivos.service.js";
import * as equiposService from "../services/equipos.service.js";

function responderErrorValidacion(res: Response, error: ZodError): void {
  res.status(400).json({
    mensaje: "Datos inválidos",
    errores: error.flatten().fieldErrors,
  });
}

function parsearIdParam(req: Request, res: Response): number | null {
  const resultado = esquemaIdEquipo.safeParse(req.params.id);
  if (!resultado.success) {
    responderErrorValidacion(res, resultado.error);
    return null;
  }
  return resultado.data;
}

export async function listarEquipos(_req: Request, res: Response): Promise<void> {
  try {
    const equipos = await equiposService.listarEquipos();
    res.json(equipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar equipos" });
  }
}

export async function obtenerEquipoPorId(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const equipo = await equiposService.obtenerEquipoPorId(id);
    if (!equipo) {
      res.status(404).json({ mensaje: "Equipo no encontrado" });
      return;
    }
    res.json(equipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el equipo" });
  }
}

export async function crearEquipo(req: Request, res: Response): Promise<void> {
  const parseo = esquemaCrearEquipo.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const equipo = await equiposService.crearEquipo(parseo.data);
    res.status(201).json(equipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear el equipo" });
  }
}

export async function actualizarEquipo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  const parseo = esquemaActualizarEquipo.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const equipo = await equiposService.actualizarEquipo(id, parseo.data);
    if (!equipo) {
      res.status(404).json({ mensaje: "Equipo no encontrado" });
      return;
    }
    res.json(equipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el equipo" });
  }
}

export async function cargarEscudoEquipo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  if (!req.file) {
    res.status(400).json({ mensaje: "Debe enviar el archivo escudo" });
    return;
  }

  try {
    const existe = await equiposService.obtenerEquipoPorId(id);
    if (!existe) {
      res.status(404).json({ mensaje: "Equipo no encontrado" });
      return;
    }

    const url = await archivosService.subirEscudoEquipo(
      req.file.buffer,
      id,
      req.file.mimetype
    );

    const equipo = await equiposService.actualizarEscudoUrl(id, url);
    if (!equipo) {
      res.status(404).json({ mensaje: "Equipo no encontrado" });
      return;
    }

    res.json(equipo);
  } catch (error) {
    console.error(error);
    const mensaje =
      error instanceof Error && error.message.includes("Cloudinary")
        ? error.message
        : "Error al subir el escudo";
    res.status(500).json({ mensaje });
  }
}

export async function eliminarEquipo(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const eliminado = await equiposService.eliminarEquipo(id);
    if (!eliminado) {
      res.status(404).json({ mensaje: "Equipo no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar el equipo" });
  }
}
