import { Router } from "express";
import {
  crearAdministrador,
  listarAdministradores,
  loginAdministrador,
  obtenerAdministradorPorId,
} from "../controllers/administradores.controller.js";
import { autenticarJwt } from "../middlewares/autenticarJwt.js";

const routerAdministradores = Router();

routerAdministradores.post("/login", loginAdministrador);
routerAdministradores.get("/", autenticarJwt, listarAdministradores);
routerAdministradores.get("/:id", autenticarJwt, obtenerAdministradorPorId);
routerAdministradores.post("/", autenticarJwt, crearAdministrador);

export { routerAdministradores };
