import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  esquemaActualizarJugador,
  esquemaCrearJugador,
  esquemaFiltroListarJugadores,
  esquemaIdJugador,
} from "../schemas/jugadores.schema.js";
import * as jugadoresService from "../services/jugadores.service.js";

function responderErrorValidacion(res: Response, error: ZodError): void {
  res.status(400).json({
    mensaje: "Datos inválidos",
    errores: error.flatten().fieldErrors,
  });
}

function parsearIdParam(req: Request, res: Response): number | null {
  const resultado = esquemaIdJugador.safeParse(req.params.id);
  if (!resultado.success) {
    responderErrorValidacion(res, resultado.error);
    return null;
  }
  return resultado.data;
}

export async function listarJugadores(req: Request, res: Response): Promise<void> {
  const parseoFiltros = esquemaFiltroListarJugadores.safeParse(req.query);
  if (!parseoFiltros.success) {
    responderErrorValidacion(res, parseoFiltros.error);
    return;
  }

  try {
    const jugadores = await jugadoresService.listarJugadores(parseoFiltros.data);
    res.json(jugadores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar jugadores" });
  }
}

export async function obtenerJugadorPorId(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const jugador = await jugadoresService.obtenerJugadorPorId(id);
    if (!jugador) {
      res.status(404).json({ mensaje: "Jugador no encontrado" });
      return;
    }
    res.json(jugador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el jugador" });
  }
}

export async function crearJugador(req: Request, res: Response): Promise<void> {
  const parseo = esquemaCrearJugador.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const jugador = await jugadoresService.crearJugador(parseo.data);
    res.status(201).json(jugador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear el jugador" });
  }
}

export async function actualizarJugador(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  const parseo = esquemaActualizarJugador.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const jugador = await jugadoresService.actualizarJugador(id, parseo.data);
    if (!jugador) {
      res.status(404).json({ mensaje: "Jugador no encontrado" });
      return;
    }
    res.json(jugador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el jugador" });
  }
}

export async function eliminarJugador(req: Request, res: Response): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const eliminado = await jugadoresService.eliminarJugador(id);
    if (!eliminado) {
      res.status(404).json({ mensaje: "Jugador no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar el jugador" });
  }
}
