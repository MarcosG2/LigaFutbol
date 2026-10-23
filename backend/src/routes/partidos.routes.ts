import { Router } from "express";
import {
  crearPartido,
  eliminarPartido,
  listarPartidos,
  obtenerPartidoPorId,
  actualizarPartido,
} from "../controllers/partidos.controller.js";
import { autenticarJwt } from "../middlewares/autenticarJwt.js";

const routerPartidos = Router();

routerPartidos.get("/", listarPartidos);
routerPartidos.get("/:id", obtenerPartidoPorId);
routerPartidos.post("/", autenticarJwt, crearPartido);
routerPartidos.put("/:id", autenticarJwt, actualizarPartido);
routerPartidos.delete("/:id", autenticarJwt, eliminarPartido);

export { routerPartidos };
