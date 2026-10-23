import { Router } from "express";
import {
  listarSancionesTorneo,
  registrarSancionTorneo,
} from "../controllers/sanciones.controller.js";
import {
  crearTorneo,
  eliminarTorneo,
  listarTorneos,
  obtenerTablaTorneo,
  obtenerTorneoPorId,
  actualizarTorneo,
} from "../controllers/torneos.controller.js";
import { autenticarJwt } from "../middlewares/autenticarJwt.js";

const routerTorneos = Router();

routerTorneos.get("/", listarTorneos);
routerTorneos.get("/:id/tabla", obtenerTablaTorneo);
routerTorneos.get("/:id/sanciones", listarSancionesTorneo);
routerTorneos.post("/:id/sanciones", autenticarJwt, registrarSancionTorneo);
routerTorneos.get("/:id", obtenerTorneoPorId);
routerTorneos.post("/", autenticarJwt, crearTorneo);
routerTorneos.put("/:id", autenticarJwt, actualizarTorneo);
routerTorneos.delete("/:id", autenticarJwt, eliminarTorneo);

export { routerTorneos };
