import { Router } from "express";
import {
  actualizarSancionTorneo,
  eliminarSancionTorneo,
  listarSancionesTorneo,
  registrarSancionTorneo,
} from "../controllers/sanciones.controller.js";
import {
  crearTorneo,
  eliminarTorneo,
  inscribirEquipoEnTorneo,
  retirarEquipoDeTorneo,
  listarEquiposTorneo,
  listarTorneos,
  obtenerTablaTorneo,
  obtenerTorneoActivo,
  obtenerTorneoPorId,
  actualizarTorneo,
  reemplazarEquipoEnTorneo,
} from "../controllers/torneos.controller.js";
import { autenticarJwt } from "../middlewares/autenticarJwt.js";

const routerTorneos = Router();

routerTorneos.get("/", listarTorneos);
routerTorneos.get("/activo", obtenerTorneoActivo);
routerTorneos.get("/:id/tabla", obtenerTablaTorneo);
routerTorneos.get("/:id/equipos", listarEquiposTorneo);
routerTorneos.post("/:id/equipos", autenticarJwt, inscribirEquipoEnTorneo);
routerTorneos.delete("/:id/equipos/:equipoId", autenticarJwt, retirarEquipoDeTorneo);
routerTorneos.post("/:id/reemplazo-equipo", autenticarJwt, reemplazarEquipoEnTorneo);
routerTorneos.get("/:id/sanciones", listarSancionesTorneo);
routerTorneos.post("/:id/sanciones", autenticarJwt, registrarSancionTorneo);
routerTorneos.put("/:id/sanciones/:sancionId", autenticarJwt, actualizarSancionTorneo);
routerTorneos.delete("/:id/sanciones/:sancionId", autenticarJwt, eliminarSancionTorneo);
routerTorneos.get("/:id", obtenerTorneoPorId);
routerTorneos.post("/", autenticarJwt, crearTorneo);
routerTorneos.put("/:id", autenticarJwt, actualizarTorneo);
routerTorneos.delete("/:id", autenticarJwt, eliminarTorneo);

export { routerTorneos };
