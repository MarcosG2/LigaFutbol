import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type {
  DatosActualizarTorneo,
  DatosCrearTorneo,
} from "../schemas/torneos.schema.js";
import type {
  EstadoInscripcionTorneo,
  FilaTablaPosicion,
  Torneo,
} from "../types/entidades.js";
import { obtenerPuntosDescontadosPorTorneo } from "./sanciones.service.js";
import {
  listarEquiposEnTorneo,
  listarEquiposParaTabla,
  torneoTieneInscripciones,
} from "./torneoEquipos.service.js";

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

export async function obtenerTorneoActivo(): Promise<Torneo | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelect} FROM Torneos WHERE estado = 'Activo' ORDER BY id DESC LIMIT 1`
  );
  return filas.length > 0 ? (filas[0] as Torneo) : null;
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
  torneoId: number,
  opciones?: { incluirRetirados?: boolean }
): Promise<FilaTablaPosicion[]> {
  const torneo = await buscarTorneoPorId(torneoId);
  if (!torneo) {
    return [];
  }

  const incluirRetirados = opciones?.incluirRetirados === true;
  const usaInscripciones = await torneoTieneInscripciones(torneoId);

  type FilaEquipoTabla = {
    equipo_id: number;
    nombre: string;
    escudo_url: string | null;
    joined_from_round: number;
    status_inscripcion?: EstadoInscripcionTorneo;
  };

  let filasEquipos: FilaEquipoTabla[];

  if (usaInscripciones) {
    const inscriptos = await listarEquiposParaTabla(torneoId, incluirRetirados);
    filasEquipos = inscriptos.map((fila) => ({
      equipo_id: fila.equipo_id,
      nombre: fila.nombre,
      escudo_url: fila.escudo_url,
      joined_from_round: fila.joined_from_round,
      status_inscripcion: fila.status,
    }));
  } else {
    const equipos = await listarEquiposEnTorneo(torneoId);
    filasEquipos = equipos.map((equipo) => ({
      equipo_id: equipo.id,
      nombre: equipo.nombre,
      escudo_url: equipo.escudo_url ?? null,
      joined_from_round: 1,
    }));
  }

  const joinedFromPorEquipo = new Map(
    filasEquipos.map((fila) => [fila.equipo_id, fila.joined_from_round])
  );

  // Solo partidos Jugado suman PJ y puntos; Suspendido/Reprogramado/Pendiente no cuentan.
  const [filasPartidos] = await pool.execute<RowDataPacket[]>(
    `SELECT equipo_local_id, equipo_visitante_id, goles_local, goles_visitante, numero_fecha
     FROM Partidos
     WHERE torneo_id = ? AND estado = 'Jugado'`,
    [torneoId]
  );

  const stats = new Map<number, EstadisticasEquipo>();

  for (const partido of filasPartidos) {
    const localId = partido.equipo_local_id as number;
    const visitanteId = partido.equipo_visitante_id as number;
    const numeroFecha = partido.numero_fecha as number | null;
    const golesLocal = (partido.goles_local as number | null) ?? 0;
    const golesVisitante = (partido.goles_visitante as number | null) ?? 0;

    const desdeLocal = joinedFromPorEquipo.get(localId) ?? 1;
    const desdeVisitante = joinedFromPorEquipo.get(visitanteId) ?? 1;
    const jornada = numeroFecha ?? 1;

    if (jornada >= desdeLocal) {
      registrarResultado(stats, localId, golesLocal, golesVisitante);
    }
    if (jornada >= desdeVisitante) {
      registrarResultado(stats, visitanteId, golesVisitante, golesLocal);
    }
  }

  let descuentosPorEquipo = new Map<number, number>();
  try {
    descuentosPorEquipo = await obtenerPuntosDescontadosPorTorneo(torneoId);
  } catch {
    descuentosPorEquipo = new Map();
  }

  const tabla: FilaTablaPosicion[] = filasEquipos.map((fila) => {
    const equipoId = fila.equipo_id;
    const s = stats.get(equipoId) ?? estadisticasVacias();
    const puntosDescontados = descuentosPorEquipo.get(equipoId) ?? 0;
    const ptsNetos = Math.max(0, s.pts - puntosDescontados);
    const filaTabla: FilaTablaPosicion = {
      equipo_id: equipoId,
      nombre: fila.nombre,
      escudo_url: fila.escudo_url,
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
    if (usaInscripciones) {
      filaTabla.status_inscripcion = fila.status_inscripcion;
      filaTabla.joined_from_round = fila.joined_from_round;
    }
    return filaTabla;
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
