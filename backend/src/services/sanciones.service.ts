import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type {
  DatosActualizarSancion,
  DatosRegistrarSancion,
} from "../schemas/sanciones.schema.js";
import type { SancionEquipo } from "../types/entidades.js";

function mapearFilaSancion(fila: RowDataPacket): SancionEquipo {
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

async function buscarSancionEnTorneo(
  torneoId: number,
  sancionId: number
): Promise<SancionEquipo | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT s.id, s.torneo_id, s.equipo_id, s.puntos, s.motivo, s.creado_en,
            e.nombre AS nombre_equipo
     FROM Sanciones s
     INNER JOIN Equipos e ON e.id = s.equipo_id
     WHERE s.id = ? AND s.torneo_id = ?`,
    [sancionId, torneoId]
  );

  return filas.length > 0 ? mapearFilaSancion(filas[0]) : null;
}

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

  return filas.map((fila) => mapearFilaSancion(fila));
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

  return mapearFilaSancion(filas[0]);
}

export async function actualizarSancion(
  torneoId: number,
  sancionId: number,
  datos: DatosActualizarSancion
): Promise<SancionEquipo | null> {
  const existente = await buscarSancionEnTorneo(torneoId, sancionId);
  if (!existente) {
    return null;
  }

  if (datos.equipo_id !== undefined) {
    const [equipos] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM Equipos WHERE id = ?`,
      [datos.equipo_id]
    );
    if (equipos.length === 0) {
      return null;
    }
  }

  const asignaciones: string[] = [];
  const valores: (number | string)[] = [];

  if (datos.equipo_id !== undefined) {
    asignaciones.push("equipo_id = ?");
    valores.push(datos.equipo_id);
  }
  if (datos.puntos !== undefined) {
    asignaciones.push("puntos = ?");
    valores.push(datos.puntos);
  }
  if (datos.motivo !== undefined) {
    asignaciones.push("motivo = ?");
    valores.push(datos.motivo);
  }

  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE Sanciones SET ${asignaciones.join(", ")} WHERE id = ? AND torneo_id = ?`,
    [...valores, sancionId, torneoId]
  );

  if (resultado.affectedRows === 0) {
    return null;
  }

  return buscarSancionEnTorneo(torneoId, sancionId);
}

export async function eliminarSancion(
  torneoId: number,
  sancionId: number
): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `DELETE FROM Sanciones WHERE id = ? AND torneo_id = ?`,
    [sancionId, torneoId]
  );
  return resultado.affectedRows > 0;
}
