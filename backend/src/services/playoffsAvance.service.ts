import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type { Partido } from "../types/entidades.js";
import * as partidosService from "./partidos.service.js";

function idGanador(partido: Partido): number | null {
  if (partido.estado !== "Jugado") return null;
  const gl = partido.goles_local;
  const gv = partido.goles_visitante;
  if (gl === null || gv === null || gl === gv) return null;
  return gl > gv ? partido.equipo_local_id : partido.equipo_visitante_id;
}

async function listarPartidosPlayoffDeFecha(
  torneoId: number,
  numeroFecha: number
): Promise<Partido[]> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT id, torneo_id, numero_fecha, numero_partido, equipo_local_id, equipo_visitante_id,
            goles_local, goles_visitante, fecha_hora, cancha, estado, destacado_portada, es_playoff
     FROM Partidos
     WHERE torneo_id = ? AND numero_fecha = ? AND es_playoff = 1
     ORDER BY numero_partido IS NULL, numero_partido ASC, id ASC`,
    [torneoId, numeroFecha]
  );

  return filas.map((fila) => ({
    ...(fila as Partido),
    destacado_portada: Boolean(fila.destacado_portada),
    es_playoff: Boolean(fila.es_playoff),
  }));
}

async function cantidadPartidosPlayoffEnFecha(
  torneoId: number,
  numeroFecha: number
): Promise<number> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM Partidos
     WHERE torneo_id = ? AND numero_fecha = ? AND es_playoff = 1`,
    [torneoId, numeroFecha]
  );
  return Number(filas[0]?.total ?? 0);
}

function fechaPlayoffListaParaAvanzar(partidos: Partido[]): number[] | null {
  if (partidos.length === 0) return null;

  const ganadores: number[] = [];
  for (const partido of partidos) {
    const ganador = idGanador(partido);
    if (ganador === null) return null;
    ganadores.push(ganador);
  }
  return ganadores;
}

async function resolverNumeroFechaSiguiente(
  torneoId: number,
  fechaCompletada: number
): Promise<number> {
  const candidato = fechaCompletada + 1;
  const ocupada = await cantidadPartidosPlayoffEnFecha(torneoId, candidato);
  if (ocupada === 0) return candidato;

  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT MAX(numero_fecha) AS max_fecha FROM Partidos WHERE torneo_id = ?`,
    [torneoId]
  );
  const maxFecha = filas[0]?.max_fecha as number | null;
  return (maxFecha ?? fechaCompletada) + 1;
}

/**
 * Si todos los partidos playoff de la fecha quedaron jugados con ganador,
 * crea la siguiente fecha con los cruces de ganadores (1 vs 2, 3 vs 4, …).
 */
export async function intentarGenerarSiguienteRondaPlayoff(
  partidoActualizado: Partido
): Promise<{ generado: boolean; numero_fecha?: number; partidos_creados?: number }> {
  if (!partidoActualizado.es_playoff) {
    return { generado: false };
  }
  if (partidoActualizado.estado !== "Jugado") {
    return { generado: false };
  }
  const numeroFecha = partidoActualizado.numero_fecha;
  if (numeroFecha === null || numeroFecha < 1) {
    return { generado: false };
  }

  const partidosFecha = await listarPartidosPlayoffDeFecha(
    partidoActualizado.torneo_id,
    numeroFecha
  );
  const ganadores = fechaPlayoffListaParaAvanzar(partidosFecha);
  if (!ganadores || ganadores.length < 2) {
    return { generado: false };
  }

  const numeroSiguiente = await resolverNumeroFechaSiguiente(
    partidoActualizado.torneo_id,
    numeroFecha
  );

  const yaExisteSiguiente = await cantidadPartidosPlayoffEnFecha(
    partidoActualizado.torneo_id,
    numeroSiguiente
  );
  if (yaExisteSiguiente > 0) {
    return { generado: false };
  }

  const cruces: { local: number; visitante: number; numero_partido: number }[] = [];
  for (let i = 0; i < ganadores.length; i += 2) {
    if (i + 1 >= ganadores.length) break;
    cruces.push({
      local: ganadores[i],
      visitante: ganadores[i + 1],
      numero_partido: cruces.length + 1,
    });
  }

  if (cruces.length === 0) {
    return { generado: false };
  }

  for (const cruce of cruces) {
    await partidosService.crearPartido({
      torneo_id: partidoActualizado.torneo_id,
      numero_fecha: numeroSiguiente,
      numero_partido: cruce.numero_partido,
      equipo_local_id: cruce.local,
      equipo_visitante_id: cruce.visitante,
      goles_local: null,
      goles_visitante: null,
      fecha_hora: null,
      cancha: "Cancha 1",
      estado: "Pendiente",
      destacado_portada: cruce.numero_partido === 1,
      es_playoff: true,
    });
  }

  return {
    generado: true,
    numero_fecha: numeroSiguiente,
    partidos_creados: cruces.length,
  };
}
