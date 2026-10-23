import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AdministradorPublico } from "../types/entidades.js";

type PayloadJwt = {
  sub: number;
  usuario: string;
};

export function autenticarJwt(req: Request, res: Response, next: NextFunction): void {
  const encabezado = req.headers.authorization;
  if (!encabezado?.startsWith("Bearer ")) {
    res.status(401).json({ mensaje: "Token no proporcionado" });
    return;
  }

  const token = encabezado.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ mensaje: "Token no proporcionado" });
    return;
  }

  try {
    const decodificado = jwt.verify(token, env.JWT_SECRET) as unknown as PayloadJwt;
    req.administrador = {
      id: decodificado.sub,
      usuario: decodificado.usuario,
    } satisfies AdministradorPublico;
    next();
  } catch {
    res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
}
