import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type {
  DatosActualizarEquipo,
  DatosCrearEquipo,
} from "../schemas/equipos.schema.js";
import type { Equipo } from "../types/entidades.js";

const columnasSelect = "id, nombre, escudo_url, instagram, estado";

async function buscarEquipoPorId(id: number): Promise<Equipo | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelect} FROM Equipos WHERE id = ?`,
    [id]
  );
  return filas.length > 0 ? (filas[0] as Equipo) : null;
}

export async function listarEquipos(): Promise<Equipo[]> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelect} FROM Equipos ORDER BY nombre ASC`
  );
  return filas as Equipo[];
}

export async function obtenerEquipoPorId(id: number): Promise<Equipo | null> {
  return buscarEquipoPorId(id);
}

export async function crearEquipo(datos: DatosCrearEquipo): Promise<Equipo> {
  const { nombre, escudo_url, instagram, estado } = datos;

  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO Equipos (nombre, escudo_url, instagram, estado) VALUES (?, ?, ?, ?)`,
    [nombre, escudo_url, instagram, estado]
  );

  const equipo = await buscarEquipoPorId(resultado.insertId);
  if (!equipo) {
    throw new Error("No se pudo recuperar el equipo creado");
  }
  return equipo;
}

export async function actualizarEquipo(
  id: number,
  datos: DatosActualizarEquipo
): Promise<Equipo | null> {
  const asignaciones: string[] = [];
  const valores: (string | null)[] = [];

  if (datos.nombre !== undefined) {
    asignaciones.push("nombre = ?");
    valores.push(datos.nombre);
  }
  if (datos.escudo_url !== undefined) {
    asignaciones.push("escudo_url = ?");
    valores.push(datos.escudo_url);
  }
  if (datos.instagram !== undefined) {
    asignaciones.push("instagram = ?");
    valores.push(datos.instagram);
  }
  if (datos.estado !== undefined) {
    asignaciones.push("estado = ?");
    valores.push(datos.estado);
  }

  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE Equipos SET ${asignaciones.join(", ")} WHERE id = ?`,
    [...valores, id]
  );

  if (resultado.affectedRows === 0) {
    return null;
  }

  return buscarEquipoPorId(id);
}

export async function actualizarEscudoUrl(
  id: number,
  escudo_url: string | null
): Promise<Equipo | null> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE Equipos SET escudo_url = ? WHERE id = ?`,
    [escudo_url, id]
  );

  if (resultado.affectedRows === 0) {
    return null;
  }

  return buscarEquipoPorId(id);
}

export async function eliminarEquipo(id: number): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `DELETE FROM Equipos WHERE id = ?`,
    [id]
  );
  return resultado.affectedRows > 0;
}
