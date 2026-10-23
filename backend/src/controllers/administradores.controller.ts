import type { Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import {
  esquemaCrearAdministrador,
  esquemaIdAdministrador,
  esquemaLoginAdministrador,
} from "../schemas/administradores.schema.js";
import * as administradoresService from "../services/administradores.service.js";
import { emitirToken } from "../services/jwt.service.js";

function responderErrorValidacion(res: Response, error: ZodError): void {
  res.status(400).json({
    mensaje: "Datos inválidos",
    errores: error.flatten().fieldErrors,
  });
}

function parsearIdParam(req: Request, res: Response): number | null {
  const resultado = esquemaIdAdministrador.safeParse(req.params.id);
  if (!resultado.success) {
    responderErrorValidacion(res, resultado.error);
    return null;
  }
  return resultado.data;
}

export async function loginAdministrador(req: Request, res: Response): Promise<void> {
  const parseo = esquemaLoginAdministrador.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const administrador = await administradoresService.validarCredenciales(
      parseo.data.usuario,
      parseo.data.password
    );
    if (!administrador) {
      res.status(401).json({ mensaje: "Credenciales inválidas" });
      return;
    }
    const token = emitirToken(administrador);
    res.json({ token, administrador });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al iniciar sesión" });
  }
}

export async function listarAdministradores(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const administradores = await administradoresService.listarAdministradores();
    res.json(administradores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar administradores" });
  }
}

export async function obtenerAdministradorPorId(
  req: Request,
  res: Response
): Promise<void> {
  const id = parsearIdParam(req, res);
  if (id === null) return;

  try {
    const administrador = await administradoresService.obtenerAdministradorPorId(id);
    if (!administrador) {
      res.status(404).json({ mensaje: "Administrador no encontrado" });
      return;
    }
    res.json(administrador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el administrador" });
  }
}

export async function crearAdministrador(req: Request, res: Response): Promise<void> {
  if (env.NODE_ENV === "production" && !env.ALLOW_ADMIN_SEED) {
    res.status(403).json({ mensaje: "Creación de administradores deshabilitada" });
    return;
  }

  const parseo = esquemaCrearAdministrador.safeParse(req.body);
  if (!parseo.success) {
    responderErrorValidacion(res, parseo.error);
    return;
  }

  try {
    const administrador = await administradoresService.crearAdministrador(parseo.data);
    res.status(201).json(administrador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear el administrador" });
  }
}
