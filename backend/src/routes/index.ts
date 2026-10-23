import { Router } from "express";
import { routerAdministradores } from "./administradores.routes.js";
import { routerEquipos } from "./equipos.routes.js";
import { routerJugadores } from "./jugadores.routes.js";
import { routerPartidos } from "./partidos.routes.js";
import { routerTorneos } from "./torneos.routes.js";

const routerApi = Router();

routerApi.use("/equipos", routerEquipos);
routerApi.use("/jugadores", routerJugadores);
routerApi.use("/partidos", routerPartidos);
routerApi.use("/torneos", routerTorneos);
routerApi.use("/administradores", routerAdministradores);

export { routerApi };
