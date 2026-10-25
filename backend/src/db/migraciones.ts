import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

/** Orden cronológico: no renombrar archivos ya aplicados en producción. */
export const ORDEN_MIGRACIONES = [
  "migracion-numero-partido.sql",
  "migracion-destacado-portada.sql",
  "migracion-sanciones.sql",
  "migracion-cancha-partido.sql",
  "migracion-estado-reprogramado.sql",
] as const;

export type NombreMigracion = (typeof ORDEN_MIGRACIONES)[number];

const directorioScripts = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../scripts"
);

async function crearConexionMigraciones() {
  return mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
  });
}

async function asegurarTablaRegistro(conexion: mysql.Connection): Promise<void> {
  await conexion.query(`
    CREATE TABLE IF NOT EXISTS schema_migraciones (
      nombre varchar(255) NOT NULL,
      aplicada_en datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (nombre)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function migracionesAplicadas(
  conexion: mysql.Connection
): Promise<Set<string>> {
  const [filas] = await conexion.query<mysql.RowDataPacket[]>(
    "SELECT nombre FROM schema_migraciones"
  );
  return new Set(filas.map((fila) => String(fila.nombre)));
}

async function registrarMigracion(
  conexion: mysql.Connection,
  nombre: NombreMigracion
): Promise<void> {
  await conexion.execute("INSERT INTO schema_migraciones (nombre) VALUES (?)", [
    nombre,
  ]);
}

export type ResultadoMigraciones = {
  aplicadas: NombreMigracion[];
  omitidas: NombreMigracion[];
};

export async function ejecutarMigracionesPendientes(): Promise<ResultadoMigraciones> {
  const conexion = await crearConexionMigraciones();
  const aplicadas: NombreMigracion[] = [];
  const omitidas: NombreMigracion[] = [];

  try {
    await asegurarTablaRegistro(conexion);
    const yaAplicadas = await migracionesAplicadas(conexion);

    for (const nombre of ORDEN_MIGRACIONES) {
      if (yaAplicadas.has(nombre)) {
        omitidas.push(nombre);
        continue;
      }

      const ruta = path.join(directorioScripts, nombre);
      const sql = await fs.readFile(ruta, "utf8");

      await conexion.query(sql);
      await registrarMigracion(conexion, nombre);
      aplicadas.push(nombre);
      console.log(`[migrate] OK: ${nombre}`);
    }

    return { aplicadas, omitidas };
  } finally {
    await conexion.end();
  }
}
