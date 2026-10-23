import "dotenv/config";
import cors from "cors";
import express from "express";
import { opcionesCors } from "./config/cors.js";
import { env } from "./config/env.js";
import { routerApi } from "./routes/index.js";

const app = express();
const puerto = env.PORT;

app.use(cors(opcionesCors));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", routerApi);

app.listen(puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${puerto} (${env.NODE_ENV})`);
});
