import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type {
  DatosActualizarPartido,
  DatosCrearPartido,
} from "../schemas/partidos.schema.js";
import type { Partido } from "../types/entidades.js";

const columnasSelect =
  "id, torneo_id, numero_fecha, numero_partido, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante, fecha_hora, estado, destacado_portada";

function filaAPartido(fila: RowDataPacket): Partido {
  return {
    ...(fila as Partido),
    destacado_portada: Boolean(fila.destacado_portada),
  };
}

async function quitarDestacadosEnFecha(
  torneoId: number,
  numeroFecha: number | null,
  exceptoId?: number
): Promise<void> {
  if (numeroFecha === null) return;

  if (exceptoId !== undefined) {
    await pool.execute(
      `UPDATE Partidos SET destacado_portada = 0 WHERE torneo_id = ? AND numero_fecha = ? AND id <> ?`,
      [torneoId, numeroFecha, exceptoId]
    );
    return;
  }

  await pool.execute(
    `UPDATE Partidos SET destacado_portada = 0 WHERE torneo_id = ? AND numero_fecha = ?`,
    [torneoId, numeroFecha]
  );
}

async function buscarPartidoPorId(id: number): Promise<Partido | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelect} FROM Partidos WHERE id = ?`,
    [id]
  );
  return filas.length > 0 ? filaAPartido(filas[0]) : null;
}

export async function listarPartidos(): Promise<Partido[]> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelect} FROM Partidos ORDER BY numero_fecha IS NULL, numero_fecha ASC, numero_partido IS NULL, numero_partido ASC, fecha_hora IS NULL, fecha_hora ASC, id ASC`
  );
  return filas.map((fila) => filaAPartido(fila));
}

export async function obtenerPartidoPorId(id: number): Promise<Partido | null> {
  return buscarPartidoPorId(id);
}

export async function crearPartido(datos: DatosCrearPartido): Promise<Partido> {
  const {
    torneo_id,
    numero_fecha,
    numero_partido,
    equipo_local_id,
    equipo_visitante_id,
    goles_local,
    goles_visitante,
    fecha_hora,
    estado,
    destacado_portada = false,
  } = datos;

  if (destacado_portada) {
    await quitarDestacadosEnFecha(torneo_id, numero_fecha ?? null);
  }

  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO Partidos (
      torneo_id, numero_fecha, numero_partido, equipo_local_id, equipo_visitante_id,
      goles_local, goles_visitante, fecha_hora, estado, destacado_portada
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      torneo_id,
      numero_fecha ?? null,
      numero_partido ?? null,
      equipo_local_id,
      equipo_visitante_id,
      goles_local ?? null,
      goles_visitante ?? null,
      fecha_hora ?? null,
      estado,
      destacado_portada ? 1 : 0,
    ]
  );

  const partido = await buscarPartidoPorId(resultado.insertId);
  if (!partido) {
    throw new Error("No se pudo recuperar el partido creado");
  }
  return partido;
}

export async function actualizarPartido(
  id: number,
  datos: DatosActualizarPartido
): Promise<Partido | null> {
  const asignaciones: string[] = [];
  const valores: (string | number | Date | null)[] = [];

  if (datos.torneo_id !== undefined) {
    asignaciones.push("torneo_id = ?");
    valores.push(datos.torneo_id);
  }
  if (datos.numero_fecha !== undefined) {
    asignaciones.push("numero_fecha = ?");
    valores.push(datos.numero_fecha);
  }
  if (datos.numero_partido !== undefined) {
    asignaciones.push("numero_partido = ?");
    valores.push(datos.numero_partido);
  }
  if (datos.equipo_local_id !== undefined) {
    asignaciones.push("equipo_local_id = ?");
    valores.push(datos.equipo_local_id);
  }
  if (datos.equipo_visitante_id !== undefined) {
    asignaciones.push("equipo_visitante_id = ?");
    valores.push(datos.equipo_visitante_id);
  }
  if (datos.goles_local !== undefined) {
    asignaciones.push("goles_local = ?");
    valores.push(datos.goles_local);
  }
  if (datos.goles_visitante !== undefined) {
    asignaciones.push("goles_visitante = ?");
    valores.push(datos.goles_visitante);
  }
  if (datos.fecha_hora !== undefined) {
    asignaciones.push("fecha_hora = ?");
    valores.push(datos.fecha_hora);
  }
  if (datos.estado !== undefined) {
    asignaciones.push("estado = ?");
    valores.push(datos.estado);
  }
  if (datos.destacado_portada !== undefined) {
    asignaciones.push("destacado_portada = ?");
    valores.push(datos.destacado_portada ? 1 : 0);
  }

  const partidoActual = await buscarPartidoPorId(id);
  if (!partidoActual) {
    return null;
  }

  const torneoId = datos.torneo_id ?? partidoActual.torneo_id;
  const numeroFecha =
    datos.numero_fecha !== undefined ? datos.numero_fecha : partidoActual.numero_fecha;

  if (datos.destacado_portada === true) {
    await quitarDestacadosEnFecha(torneoId, numeroFecha, id);
  }

  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE Partidos SET ${asignaciones.join(", ")} WHERE id = ?`,
    [...valores, id]
  );

  if (resultado.affectedRows === 0) {
    return null;
  }

  return buscarPartidoPorId(id);
}

export async function eliminarPartido(id: number): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `DELETE FROM Partidos WHERE id = ?`,
    [id]
  );
  return resultado.affectedRows > 0;
}
