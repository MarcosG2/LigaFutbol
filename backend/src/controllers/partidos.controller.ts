import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  esquemaActualizarPartido,
  esquemaCrearPartido,
  esquemaGenerarAleatoriosFecha,
  esquemaGenerarPlayoffs,
  esquemaIdPartido,
} from "../schemas/partidos.schema.js";
import { esquemaIdTorneo } from "../schemas/torneos.schema.js";
import * as fixtureGeneradorService from "../services/fixtureGenerador.service.js";
import * as partidosService from "../services/partidos.service.js";
import { intentarGenerarSiguienteRondaPlayoff } from "../services/playoffsAvance.service.js";

function responderErrorValidacion(res: Response, error: ZodError): void {
  res.status(400).json({
    mensaje: "Datos inválidos",
    errores: error.flatten().fieldErrors,
  });
}

function parsearIdParam(req: Request, res: Response): number | null {
  const resultado = esquemaIdPartido.safeParse(req.params.id);
  if (!resultado.success) {
    responderErrorValidacion(res, resultado.error);
    return null;
  }
  return resultado.data;
}

export async function listarPartidos(req: Request, res: Response): Promise<void> {
  let torneoId: number | undefined;
  if (req.query.torneo_id !== undefined) {
    const parseo = esquemaIdTorneo.safeParse(req.query.torneo_id);
    if (!parseo.success) {
      responderErrorValidacion(res, parseo.error);
      return;
    }
    torneoId = parseo.data;
  }

  try {
    const partidos = await partidosService.listarPartidos(torneoId);
    res.json(partidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar partidos" });
  }
}

export async function obtenerPartidoPorId(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const partido = await partidosService.obtenerPartidoPorId(id);
    if (!partido) {
      res.status(404).json({ mensaje: "Partido no encontrado" });
      return;
    }
    res.json(partido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el partido" });
  }
}

export async function crearPartido(req: Request, res: Response): Promise<void> {
  const parseo = esquemaCrearPartido.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const partido = await partidosService.crearPartido(parseo.data);
    res.status(201).json(partido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear el partido" });
  }
}

export async function actualizarPartido(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  const parseo = esquemaActualizarPartido.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const partido = await partidosService.actualizarPartido(id, parseo.data);
    if (!partido) {
      res.status(404).json({ mensaje: "Partido no encontrado" });
      return;
    }

    try {
      await intentarGenerarSiguienteRondaPlayoff(partido);
    } catch (avanceError) {
      console.error("Error al avanzar ronda de playoffs:", avanceError);
    }

    res.json(partido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el partido" });
  }
}

export async function generarPartidosAleatoriosFecha(
  req: Request,
  res: Response
): Promise<void> {
  const parseo = esquemaGenerarAleatoriosFecha.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const resultado = await fixtureGeneradorService.generarPartidosAleatoriosParaFecha(
      parseo.data.torneo_id,
      parseo.data.numero_fecha
    );
    res.json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al generar partidos aleatorios";
    res.status(400).json({ mensaje });
  }
}

export async function generarEtapaPlayoffs(req: Request, res: Response): Promise<void> {
  const parseo = esquemaGenerarPlayoffs.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const crucesManual = parseo.data.cruces?.map((cruce, indice) => ({
      equipo_local_id: cruce.equipo_local_id,
      equipo_visitante_id: cruce.equipo_visitante_id,
      numero_partido: cruce.numero_partido ?? indice + 1,
    }));

    const resultado = await fixtureGeneradorService.generarEtapaPlayoffs(
      parseo.data.torneo_id,
      parseo.data.cantidad_clasificados,
      parseo.data.formato,
      parseo.data.clasificados_ids,
      crucesManual
    );
    res.json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al generar la fase de playoffs";
    res.status(400).json({ mensaje });
  }
}

export async function eliminarPartido(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const eliminado = await partidosService.eliminarPartido(id);
    if (!eliminado) {
      res.status(404).json({ mensaje: "Partido no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar el partido" });
  }
}
