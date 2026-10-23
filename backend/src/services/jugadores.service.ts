import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type {
  DatosActualizarJugador,
  DatosCrearJugador,
} from "../schemas/jugadores.schema.js";
import type { Jugador } from "../types/entidades.js";

const columnasSelect = "id, equipo_id, nombre, numero_camiseta, goles";

async function buscarJugadorPorId(id: number): Promise<Jugador | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelect} FROM Jugadores WHERE id = ?`,
    [id]
  );
  return filas.length > 0 ? (filas[0] as Jugador) : null;
}

export async function listarJugadores(filtros?: {
  equipo_id?: number;
}): Promise<Jugador[]> {
  if (filtros?.equipo_id !== undefined) {
    const [filas] = await pool.execute<RowDataPacket[]>(
      `SELECT ${columnasSelect} FROM Jugadores WHERE equipo_id = ? ORDER BY nombre ASC`,
      [filtros.equipo_id]
    );
    return filas as Jugador[];
  }

  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelect} FROM Jugadores ORDER BY nombre ASC`
  );
  return filas as Jugador[];
}

export async function obtenerJugadorPorId(id: number): Promise<Jugador | null> {
  return buscarJugadorPorId(id);
}

export async function crearJugador(datos: DatosCrearJugador): Promise<Jugador> {
  const { equipo_id, nombre, numero_camiseta, goles } = datos;

  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO Jugadores (equipo_id, nombre, numero_camiseta, goles) VALUES (?, ?, ?, ?)`,
    [equipo_id, nombre, numero_camiseta ?? null, goles ?? null]
  );

  const jugador = await buscarJugadorPorId(resultado.insertId);
  if (!jugador) {
    throw new Error("No se pudo recuperar el jugador creado");
  }
  return jugador;
}

export async function actualizarJugador(
  id: number,
  datos: DatosActualizarJugador
): Promise<Jugador | null> {
  const asignaciones: string[] = [];
  const valores: (string | number | null)[] = [];

  if (datos.equipo_id !== undefined) {
    asignaciones.push("equipo_id = ?");
    valores.push(datos.equipo_id);
  }
  if (datos.nombre !== undefined) {
    asignaciones.push("nombre = ?");
    valores.push(datos.nombre);
  }
  if (datos.numero_camiseta !== undefined) {
    asignaciones.push("numero_camiseta = ?");
    valores.push(datos.numero_camiseta);
  }
  if (datos.goles !== undefined) {
    asignaciones.push("goles = ?");
    valores.push(datos.goles);
  }

  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE Jugadores SET ${asignaciones.join(", ")} WHERE id = ?`,
    [...valores, id]
  );

  if (resultado.affectedRows === 0) {
    return null;
  }

  return buscarJugadorPorId(id);
}

export async function eliminarJugador(id: number): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `DELETE FROM Jugadores WHERE id = ?`,
    [id]
  );
  return resultado.affectedRows > 0;
}
