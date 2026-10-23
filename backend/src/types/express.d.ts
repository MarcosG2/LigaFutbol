import type { AdministradorPublico } from "./entidades.js";

declare global {
  namespace Express {
    interface Request {
      administrador?: AdministradorPublico;
    }
  }
}

export {};
