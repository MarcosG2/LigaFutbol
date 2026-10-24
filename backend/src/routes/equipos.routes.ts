import { Router } from "express";
import multer from "multer";
import {
  cargarEscudoEquipo,
  crearEquipo,
  eliminarEquipo,
  listarEquipos,
  obtenerEquipoPorId,
  actualizarEquipo,
  sincronizarPlantillaEquipo,
} from "../controllers/equipos.controller.js";
import { autenticarJwt } from "../middlewares/autenticarJwt.js";
import { subirEscudo } from "../middlewares/subirEscudo.js";

const routerEquipos = Router();

routerEquipos.get("/", listarEquipos);
routerEquipos.get("/:id", obtenerEquipoPorId);
routerEquipos.post(
  "/:id/escudo",
  autenticarJwt,
  (req, res, next) => {
    subirEscudo(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        res.status(400).json({ mensaje: error.message });
        return;
      }
      if (error) {
        res.status(400).json({ mensaje: error.message });
        return;
      }
      next();
    });
  },
  cargarEscudoEquipo
);
routerEquipos.post("/", autenticarJwt, crearEquipo);
routerEquipos.put("/:id/plantilla", autenticarJwt, sincronizarPlantillaEquipo);
routerEquipos.put("/:id", autenticarJwt, actualizarEquipo);
routerEquipos.delete("/:id", autenticarJwt, eliminarEquipo);

export { routerEquipos };
