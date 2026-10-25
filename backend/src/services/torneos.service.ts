import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type {
  DatosActualizarTorneo,
  DatosCrearTorneo,
} from "../schemas/torneos.schema.js";
import type { FilaTablaPosicion, Torneo } from "../types/entidades.js";
import { obtenerPuntosDescontadosPorTorneo } from "./sanciones.service.js";

const columnasSelect = "id, nombre, estado";

async function buscarTorneoPorId(id: number): Promise<Torneo | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelect} FROM Torneos WHERE id = ?`,
    [id]
  );
  return filas.length > 0 ? (filas[0] as Torneo) : null;
}

export async function listarTorneos(): Promise<Torneo[]> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelect} FROM Torneos ORDER BY nombre ASC`
  );
  return filas as Torneo[];
}

export async function obtenerTorneoPorId(id: number): Promise<Torneo | null> {
  return buscarTorneoPorId(id);
}

export async function crearTorneo(datos: DatosCrearTorneo): Promise<Torneo> {
  const { nombre, estado } = datos;

  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO Torneos (nombre, estado) VALUES (?, ?)`,
    [nombre, estado]
  );

  const torneo = await buscarTorneoPorId(resultado.insertId);
  if (!torneo) {
    throw new Error("No se pudo recuperar el torneo creado");
  }
  return torneo;
}

export async function actualizarTorneo(
  id: number,
  datos: DatosActualizarTorneo
): Promise<Torneo | null> {
  const asignaciones: string[] = [];
  const valores: string[] = [];

  if (datos.nombre !== undefined) {
    asignaciones.push("nombre = ?");
    valores.push(datos.nombre);
  }
  if (datos.estado !== undefined) {
    asignaciones.push("estado = ?");
    valores.push(datos.estado);
  }

  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE Torneos SET ${asignaciones.join(", ")} WHERE id = ?`,
    [...valores, id]
  );

  if (resultado.affectedRows === 0) {
    return null;
  }

  return buscarTorneoPorId(id);
}

type EstadisticasEquipo = {
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  pts: number;
};

function estadisticasVacias(): EstadisticasEquipo {
  return { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
}

function registrarResultado(
  stats: Map<number, EstadisticasEquipo>,
  equipoId: number,
  golesFavor: number,
  golesContra: number
): void {
  const actual = stats.get(equipoId) ?? estadisticasVacias();
  actual.pj += 1;
  actual.gf += golesFavor;
  actual.gc += golesContra;
  if (golesFavor > golesContra) {
    actual.pg += 1;
    actual.pts += 3;
  } else if (golesFavor === golesContra) {
    actual.pe += 1;
    actual.pts += 1;
  } else {
    actual.pp += 1;
  }
  stats.set(equipoId, actual);
}

export async function obtenerTablaPosiciones(
  torneoId: number
): Promise<FilaTablaPosicion[]> {
  const torneo = await buscarTorneoPorId(torneoId);
  if (!torneo) {
    return [];
  }

  const [filasEquipos] = await pool.execute<RowDataPacket[]>(
    `SELECT id, nombre, escudo_url FROM Equipos ORDER BY nombre ASC`
  );

  // Solo partidos Jugado suman PJ y puntos; Suspendido/Reprogramado/Pendiente no cuentan.
  const [filasPartidos] = await pool.execute<RowDataPacket[]>(
    `SELECT equipo_local_id, equipo_visitante_id, goles_local, goles_visitante
     FROM Partidos
     WHERE torneo_id = ? AND estado = 'Jugado'`,
    [torneoId]
  );

  const stats = new Map<number, EstadisticasEquipo>();

  for (const partido of filasPartidos) {
    const localId = partido.equipo_local_id as number;
    const visitanteId = partido.equipo_visitante_id as number;
    const golesLocal = (partido.goles_local as number | null) ?? 0;
    const golesVisitante = (partido.goles_visitante as number | null) ?? 0;
    registrarResultado(stats, localId, golesLocal, golesVisitante);
    registrarResultado(stats, visitanteId, golesVisitante, golesLocal);
  }

  let descuentosPorEquipo = new Map<number, number>();
  try {
    descuentosPorEquipo = await obtenerPuntosDescontadosPorTorneo(torneoId);
  } catch {
    descuentosPorEquipo = new Map();
  }

  const tabla: FilaTablaPosicion[] = filasEquipos.map((fila) => {
    const equipoId = fila.id as number;
    const nombre = fila.nombre as string;
    const s = stats.get(equipoId) ?? estadisticasVacias();
    const puntosDescontados = descuentosPorEquipo.get(equipoId) ?? 0;
    const ptsNetos = Math.max(0, s.pts - puntosDescontados);
    return {
      equipo_id: equipoId,
      nombre,
      escudo_url: (fila.escudo_url as string | null) ?? null,
      pj: s.pj,
      pg: s.pg,
      pe: s.pe,
      pp: s.pp,
      gf: s.gf,
      gc: s.gc,
      puntos_descontados: puntosDescontados,
      pts: ptsNetos,
      dg: s.gf - s.gc,
    };
  });

  return tabla.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

export async function eliminarTorneo(id: number): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `DELETE FROM Torneos WHERE id = ?`,
    [id]
  );
  return resultado.affectedRows > 0;
}
