import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AdministradorPublico } from "../types/entidades.js";

export function emitirToken(administrador: AdministradorPublico): string {
  return jwt.sign(
    { sub: administrador.id, usuario: administrador.usuario },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
}
