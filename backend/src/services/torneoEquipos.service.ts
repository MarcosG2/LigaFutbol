import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type { Equipo, EstadoInscripcionTorneo, TorneoEquipo } from "../types/entidades.js";

export type EquipoEnTorneoTabla = {
  equipo_id: number;
  nombre: string;
  escudo_url: string | null;
  joined_from_round: number;
  status: EstadoInscripcionTorneo;
};

export class ErrorReemplazoEquipo extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorReemplazoEquipo";
  }
}

const columnasInscripcion =
  "id, torneo_id, equipo_id, status, joined_from_round, withdrawn_at_round";

export async function torneoTieneInscripciones(torneoId: number): Promise<boolean> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 FROM TorneoEquipos WHERE torneo_id = ? LIMIT 1`,
    [torneoId]
  );
  return filas.length > 0;
}

export async function listarEquiposParaTabla(
  torneoId: number,
  incluirRetirados: boolean
): Promise<EquipoEnTorneoTabla[]> {
  const filtroStatus = incluirRetirados
    ? ""
    : " AND te.status = 'ACTIVE'";

  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT e.id AS equipo_id, e.nombre, e.escudo_url, te.joined_from_round, te.status
     FROM TorneoEquipos te
     INNER JOIN Equipos e ON e.id = te.equipo_id
     WHERE te.torneo_id = ?${filtroStatus}
     ORDER BY e.nombre ASC`,
    [torneoId]
  );

  return filas.map((fila) => ({
    equipo_id: fila.equipo_id as number,
    nombre: fila.nombre as string,
    escudo_url: (fila.escudo_url as string | null) ?? null,
    joined_from_round: fila.joined_from_round as number,
    status: fila.status as EstadoInscripcionTorneo,
  }));
}

const columnasEquipo =
  "e.id, e.nombre, e.escudo_url, e.instagram, e.estado";

/** Equipos que participan en el torneo (inscripción o al menos un partido). */
export async function listarEquiposEnTorneo(torneoId: number): Promise<Equipo[]> {
  const tiene = await torneoTieneInscripciones(torneoId);
  if (tiene) {
    const [filas] = await pool.execute<RowDataPacket[]>(
      `SELECT ${columnasEquipo}
       FROM TorneoEquipos te
       INNER JOIN Equipos e ON e.id = te.equipo_id
       WHERE te.torneo_id = ? AND te.status = 'ACTIVE'
         AND (e.estado IS NULL OR e.estado = 'Activo')
       ORDER BY e.nombre ASC`,
      [torneoId]
    );
    return filas as Equipo[];
  }

  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT DISTINCT ${columnasEquipo}
     FROM Equipos e
     INNER JOIN Partidos p ON p.torneo_id = ?
       AND (p.equipo_local_id = e.id OR p.equipo_visitante_id = e.id)
     WHERE e.estado IS NULL OR e.estado = 'Activo'
     ORDER BY e.nombre ASC`,
    [torneoId]
  );
  return filas as Equipo[];
}

export async function listarEquiposActivosEnTorneo(
  torneoId: number
): Promise<{ id: number; nombre: string }[]> {
  const tiene = await torneoTieneInscripciones(torneoId);
  if (!tiene) {
    const [filas] = await pool.execute<RowDataPacket[]>(
      `SELECT id, nombre FROM Equipos
       WHERE estado IS NULL OR estado = 'Activo'
       ORDER BY nombre ASC`
    );
    return filas.map((fila) => ({
      id: fila.id as number,
      nombre: fila.nombre as string,
    }));
  }

  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT e.id, e.nombre
     FROM TorneoEquipos te
     INNER JOIN Equipos e ON e.id = te.equipo_id
     WHERE te.torneo_id = ? AND te.status = 'ACTIVE'
       AND (e.estado IS NULL OR e.estado = 'Activo')
     ORDER BY e.nombre ASC`,
    [torneoId]
  );

  return filas.map((fila) => ({
    id: fila.id as number,
    nombre: fila.nombre as string,
  }));
}

export async function retirarEquipoDeTorneo(
  torneoId: number,
  equipoId: number
): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE TorneoEquipos
     SET status = 'WITHDRAWN'
     WHERE torneo_id = ? AND equipo_id = ? AND status = 'ACTIVE'`,
    [torneoId, equipoId]
  );
  return resultado.affectedRows > 0;
}

export async function inscribirEquipoEnTorneo(
  torneoId: number,
  equipoId: number,
  joinedFromRound = 1
): Promise<TorneoEquipo> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO TorneoEquipos (torneo_id, equipo_id, status, joined_from_round)
     VALUES (?, ?, 'ACTIVE', ?)
     ON DUPLICATE KEY UPDATE
       status = IF(status IN ('WITHDRAWN', 'REPLACED'), 'ACTIVE', status),
       joined_from_round = IF(status IN ('WITHDRAWN', 'REPLACED'), VALUES(joined_from_round), joined_from_round),
       withdrawn_at_round = IF(status IN ('WITHDRAWN', 'REPLACED'), NULL, withdrawn_at_round)`,
    [torneoId, equipoId, joinedFromRound]
  );

  const id =
    resultado.insertId > 0
      ? resultado.insertId
      : await buscarIdInscripcion(torneoId, equipoId);

  const inscripcion = await buscarInscripcionPorId(id);
  if (!inscripcion) {
    throw new Error("No se pudo recuperar la inscripción del equipo");
  }
  return inscripcion;
}

async function buscarIdInscripcion(
  torneoId: number,
  equipoId: number
): Promise<number> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM TorneoEquipos WHERE torneo_id = ? AND equipo_id = ?`,
    [torneoId, equipoId]
  );
  if (filas.length === 0) {
    throw new Error("Inscripción no encontrada");
  }
  return filas[0].id as number;
}

async function buscarInscripcionPorId(id: number): Promise<TorneoEquipo | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasInscripcion} FROM TorneoEquipos WHERE id = ?`,
    [id]
  );
  return filas.length > 0 ? (filas[0] as TorneoEquipo) : null;
}

export type ResultadoReemplazoEquipo = {
  equipo_saliente: TorneoEquipo;
  equipo_entrante: TorneoEquipo;
  partidos_actualizados: number;
};

/** Retira al equipo en la jornada N; el reemplazo juega desde N+1 en partidos pendientes con fecha > N. */
export async function reemplazarEquipoEnTorneo(
  torneoId: number,
  equipoSalienteId: number,
  equipoEntranteId: number,
  jornadaRetiro: number
): Promise<ResultadoReemplazoEquipo> {
  if (jornadaRetiro < 1) {
    throw new ErrorReemplazoEquipo("La jornada de retiro debe ser al menos 1.");
  }
  if (equipoSalienteId === equipoEntranteId) {
    throw new ErrorReemplazoEquipo("El equipo entrante debe ser distinto al saliente.");
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [filasTorneo] = await conexion.execute<RowDataPacket[]>(
      `SELECT id FROM Torneos WHERE id = ?`,
      [torneoId]
    );
    if (filasTorneo.length === 0) {
      throw new ErrorReemplazoEquipo("Torneo no encontrado.");
    }

    const [filasSaliente] = await conexion.execute<RowDataPacket[]>(
      `SELECT ${columnasInscripcion} FROM TorneoEquipos
       WHERE torneo_id = ? AND equipo_id = ? FOR UPDATE`,
      [torneoId, equipoSalienteId]
    );

    if (filasSaliente.length === 0) {
      throw new ErrorReemplazoEquipo(
        "El equipo saliente no está inscripto en este torneo. Inscribilo antes de reemplazarlo."
      );
    }

    const inscripcionSaliente = filasSaliente[0] as TorneoEquipo;
    if (inscripcionSaliente.status !== "ACTIVE") {
      throw new ErrorReemplazoEquipo("El equipo saliente no está activo en el torneo.");
    }

    const [filasEntranteEquipo] = await conexion.execute<RowDataPacket[]>(
      `SELECT id FROM Equipos WHERE id = ?`,
      [equipoEntranteId]
    );
    if (filasEntranteEquipo.length === 0) {
      throw new ErrorReemplazoEquipo("El equipo entrante no existe.");
    }

    const [filasEntranteInscripcion] = await conexion.execute<RowDataPacket[]>(
      `SELECT ${columnasInscripcion} FROM TorneoEquipos
       WHERE torneo_id = ? AND equipo_id = ? FOR UPDATE`,
      [torneoId, equipoEntranteId]
    );

    if (
      filasEntranteInscripcion.length > 0 &&
      (filasEntranteInscripcion[0] as TorneoEquipo).status === "ACTIVE"
    ) {
      throw new ErrorReemplazoEquipo(
        "El equipo entrante ya está activo en este torneo."
      );
    }

    const jornadaDesde = jornadaRetiro + 1;

    await conexion.execute(
      `UPDATE TorneoEquipos
       SET status = 'REPLACED', withdrawn_at_round = ?
       WHERE torneo_id = ? AND equipo_id = ?`,
      [jornadaRetiro, torneoId, equipoSalienteId]
    );

    if (filasEntranteInscripcion.length === 0) {
      await conexion.execute(
        `INSERT INTO TorneoEquipos (torneo_id, equipo_id, status, joined_from_round)
         VALUES (?, ?, 'ACTIVE', ?)`,
        [torneoId, equipoEntranteId, jornadaDesde]
      );
    } else {
      await conexion.execute(
        `UPDATE TorneoEquipos
         SET status = 'ACTIVE', joined_from_round = ?, withdrawn_at_round = NULL
         WHERE torneo_id = ? AND equipo_id = ?`,
        [jornadaDesde, torneoId, equipoEntranteId]
      );
    }

    const condicionPendiente = `torneo_id = ? AND estado <> 'Jugado' AND numero_fecha IS NOT NULL AND numero_fecha > ?`;

    const [resLocal] = await conexion.execute<ResultSetHeader>(
      `UPDATE Partidos SET equipo_local_id = ?
       WHERE ${condicionPendiente} AND equipo_local_id = ?`,
      [equipoEntranteId, torneoId, jornadaRetiro, equipoSalienteId]
    );

    const [resVisitante] = await conexion.execute<ResultSetHeader>(
      `UPDATE Partidos SET equipo_visitante_id = ?
       WHERE ${condicionPendiente} AND equipo_visitante_id = ?`,
      [equipoEntranteId, torneoId, jornadaRetiro, equipoSalienteId]
    );

    const partidosActualizados =
      resLocal.affectedRows + resVisitante.affectedRows;

    await conexion.commit();

    const [filasFinales] = await pool.execute<RowDataPacket[]>(
      `SELECT ${columnasInscripcion} FROM TorneoEquipos
       WHERE torneo_id = ? AND equipo_id IN (?, ?)`,
      [torneoId, equipoSalienteId, equipoEntranteId]
    );

    const mapa = new Map(
      (filasFinales as TorneoEquipo[]).map((fila) => [fila.equipo_id, fila])
    );
    const saliente = mapa.get(equipoSalienteId);
    const entrante = mapa.get(equipoEntranteId);

    if (!saliente || !entrante) {
      throw new Error("No se pudieron recuperar las inscripciones tras el reemplazo.");
    }

    return {
      equipo_saliente: saliente,
      equipo_entrante: entrante,
      partidos_actualizados: partidosActualizados,
    };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
