import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type { DatosRegistrarSancion } from "../schemas/sanciones.schema.js";
import type { SancionEquipo } from "../types/entidades.js";

export async function listarSancionesPorTorneo(
  torneoId: number
): Promise<SancionEquipo[]> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT s.id, s.torneo_id, s.equipo_id, s.puntos, s.motivo, s.creado_en,
            e.nombre AS nombre_equipo
     FROM Sanciones s
     INNER JOIN Equipos e ON e.id = s.equipo_id
     WHERE s.torneo_id = ?
     ORDER BY s.creado_en DESC`,
    [torneoId]
  );

  return filas.map((fila) => ({
    id: fila.id as number,
    torneo_id: fila.torneo_id as number,
    equipo_id: fila.equipo_id as number,
    nombre_equipo: fila.nombre_equipo as string,
    puntos: fila.puntos as number,
    motivo: fila.motivo as string,
    creado_en: fila.creado_en as Date,
  }));
}

export async function obtenerPuntosDescontadosPorTorneo(
  torneoId: number
): Promise<Map<number, number>> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT equipo_id, COALESCE(SUM(puntos), 0) AS total
     FROM Sanciones
     WHERE torneo_id = ?
     GROUP BY equipo_id`,
    [torneoId]
  );

  const mapa = new Map<number, number>();
  for (const fila of filas) {
    mapa.set(fila.equipo_id as number, Number(fila.total));
  }
  return mapa;
}

export async function registrarSancion(
  torneoId: number,
  datos: DatosRegistrarSancion
): Promise<SancionEquipo | null> {
  const [equipos] = await pool.execute<RowDataPacket[]>(
    `SELECT id, nombre FROM Equipos WHERE id = ?`,
    [datos.equipo_id]
  );
  if (equipos.length === 0) {
    return null;
  }

  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO Sanciones (torneo_id, equipo_id, puntos, motivo)
     VALUES (?, ?, ?, ?)`,
    [torneoId, datos.equipo_id, datos.puntos, datos.motivo]
  );

  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT s.id, s.torneo_id, s.equipo_id, s.puntos, s.motivo, s.creado_en,
            e.nombre AS nombre_equipo
     FROM Sanciones s
     INNER JOIN Equipos e ON e.id = s.equipo_id
     WHERE s.id = ?`,
    [resultado.insertId]
  );

  if (filas.length === 0) {
    return null;
  }

  const fila = filas[0];
  return {
    id: fila.id as number,
    torneo_id: fila.torneo_id as number,
    equipo_id: fila.equipo_id as number,
    nombre_equipo: fila.nombre_equipo as string,
    puntos: fila.puntos as number,
    motivo: fila.motivo as string,
    creado_en: fila.creado_en as Date,
  };
}
