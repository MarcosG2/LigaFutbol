import type { CorsOptions } from "cors";
import { env } from "./env.js";

const origenesDesarrollo = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

export const opcionesCors: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (env.NODE_ENV !== "production") {
      if (origenesDesarrollo.includes(origin)) {
        callback(null, true);
        return;
      }
    }

    if (origin === env.FRONTEND_URL) {
      callback(null, true);
      return;
    }

    callback(new Error("Origen no permitido por CORS"));
  },
};
