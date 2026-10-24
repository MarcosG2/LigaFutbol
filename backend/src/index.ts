import "dotenv/config";
import cors from "cors";
import express from "express";
import { opcionesCors } from "./config/cors.js";
import { env } from "./config/env.js";
import { ejecutarMigracionesPendientes } from "./db/migraciones.js";
import { routerApi } from "./routes/index.js";

const app = express();
const puerto = env.PORT;

app.use(cors(opcionesCors));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", routerApi);

async function iniciarServidor(): Promise<void> {
  if (env.RUN_MIGRATIONS_ON_START) {
    console.log("[migrate] Ejecutando migraciones pendientes antes de arrancar…");
    await ejecutarMigracionesPendientes();
  }

  app.listen(puerto, () => {
    console.log(`Servidor escuchando en http://localhost:${puerto} (${env.NODE_ENV})`);
  });
}

iniciarServidor().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error);
  process.exit(1);
});
