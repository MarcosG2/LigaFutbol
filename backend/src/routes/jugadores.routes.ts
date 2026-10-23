import { Router } from "express";
import {
  crearJugador,
  eliminarJugador,
  listarJugadores,
  obtenerJugadorPorId,
  actualizarJugador,
} from "../controllers/jugadores.controller.js";
import { autenticarJwt } from "../middlewares/autenticarJwt.js";

const routerJugadores = Router();

routerJugadores.get("/", listarJugadores);
routerJugadores.get("/:id", obtenerJugadorPorId);
routerJugadores.post("/", autenticarJwt, crearJugador);
routerJugadores.put("/:id", autenticarJwt, actualizarJugador);
routerJugadores.delete("/:id", autenticarJwt, eliminarJugador);

export { routerJugadores };
