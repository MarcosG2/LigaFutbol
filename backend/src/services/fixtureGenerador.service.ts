import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type { Partido } from "../types/entidades.js";
import { obtenerTablaPosiciones } from "./torneos.service.js";

export type CrucePropuesto = {
  equipo_local_id: number;
  equipo_visitante_id: number;
  numero_partido: number;
};

export type ResultadoGeneracionAleatoria = {
  partidos: CrucePropuesto[];
  equipo_fecha_libre: { equipo_id: number; nombre: string } | null;
};

export type FormatoPlayoff = "estandar" | "aleatorio";

export type ClasificadoPlayoff = {
  posicion: number;
  equipo_id: number;
  nombre: string;
  pts: number;
};

export type ResultadoGeneracionPlayoffs = {
  numero_fecha_sugerido: number;
  clasificados: ClasificadoPlayoff[];
  cruces: CrucePropuesto[];
};

const MAX_REINTENTOS_ALEATORIO = 400;

function clavePar(equipoA: number, equipoB: number): string {
  const menor = Math.min(equipoA, equipoB);
  const mayor = Math.max(equipoA, equipoB);
  return `${menor}:${mayor}`;
}

function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function emparejarConBacktracking(
  equipos: number[],
  paresOcupados: Set<string>
): CrucePropuesto[] | null {
  if (equipos.length === 0) return [];
  if (equipos.length === 1) return [];

  const [primero, ...resto] = equipos;
  const candidatos = mezclar(resto);

  for (const rival of candidatos) {
    const clave = clavePar(primero, rival);
    if (paresOcupados.has(clave)) continue;

    const restoSinRival = resto.filter((id) => id !== rival);
    const sub = emparejarConBacktracking(restoSinRival, paresOcupados);
    if (sub === null) continue;

    return [
      {
        equipo_local_id: primero,
        equipo_visitante_id: rival,
        numero_partido: 0,
      },
      ...sub,
    ];
  }

  return null;
}

function numerarCruces(cruces: CrucePropuesto[]): CrucePropuesto[] {
  return cruces.map((cruce, indice) => ({
    ...cruce,
    numero_partido: indice + 1,
  }));
}

async function listarEquiposActivosIds(): Promise<{ id: number; nombre: string }[]> {
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

async function listarPartidosTorneo(torneoId: number): Promise<Partido[]> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT id, torneo_id, numero_fecha, numero_partido, equipo_local_id, equipo_visitante_id,
            goles_local, goles_visitante, fecha_hora, cancha, estado, destacado_portada
     FROM Partidos WHERE torneo_id = ?`,
    [torneoId]
  );
  return filas as Partido[];
}

function construirParesOcupados(
  partidos: Partido[],
  excluirNumeroFecha?: number
): Set<string> {
  const ocupados = new Set<string>();
  for (const partido of partidos) {
    if (
      excluirNumeroFecha !== undefined &&
      partido.numero_fecha === excluirNumeroFecha
    ) {
      continue;
    }
    ocupados.add(clavePar(partido.equipo_local_id, partido.equipo_visitante_id));
  }
  return ocupados;
}

function siguienteNumeroFecha(partidos: Partido[]): number {
  const numeros = partidos
    .map((p) => p.numero_fecha)
    .filter((n): n is number => n !== null && n > 0);
  if (numeros.length === 0) return 1;
  return Math.max(...numeros) + 1;
}

export async function generarPartidosAleatoriosParaFecha(
  torneoId: number,
  numeroFecha: number
): Promise<ResultadoGeneracionAleatoria> {
  const equipos = await listarEquiposActivosIds();
  if (equipos.length < 2) {
    throw new Error("Se necesitan al menos dos equipos activos para generar cruces.");
  }

  const partidosTorneo = await listarPartidosTorneo(torneoId);
  const paresOcupados = construirParesOcupados(partidosTorneo, numeroFecha);
  const idsEquipos = equipos.map((e) => e.id);

  let mejor: CrucePropuesto[] | null = null;
  let equipoLibre: number | null = null;

  for (let intento = 0; intento < MAX_REINTENTOS_ALEATORIO; intento++) {
    const orden = mezclar(idsEquipos);
    const libre = orden.length % 2 === 1 ? orden[0] : null;
    const paraEmparejar =
      libre !== null ? orden.filter((id) => id !== libre) : orden;

    const cruces = emparejarConBacktracking(paraEmparejar, paresOcupados);
    if (cruces === null) continue;

    mejor = numerarCruces(cruces);
    equipoLibre = libre;
    break;
  }

  if (!mejor) {
    throw new Error(
      "No se encontró una combinación válida con el historial de cruces. Revisá partidos pendientes o agregá equipos."
    );
  }

  const mapaNombres = new Map(equipos.map((e) => [e.id, e.nombre]));

  return {
    partidos: mejor,
    equipo_fecha_libre:
      equipoLibre !== null
        ? {
            equipo_id: equipoLibre,
            nombre: mapaNombres.get(equipoLibre) ?? `Equipo ${equipoLibre}`,
          }
        : null,
  };
}

function armarCrucesPlayoff(
  clasificados: ClasificadoPlayoff[],
  formato: FormatoPlayoff
): CrucePropuesto[] {
  const lista =
    formato === "aleatorio" ? mezclar(clasificados) : [...clasificados];

  const cruces: CrucePropuesto[] = [];
  if (formato === "estandar") {
    const n = lista.length;
    for (let i = 0; i < n / 2; i++) {
      const local = lista[i];
      const visitante = lista[n - 1 - i];
      cruces.push({
        equipo_local_id: local.equipo_id,
        equipo_visitante_id: visitante.equipo_id,
        numero_partido: i + 1,
      });
    }
    return cruces;
  }

  for (let i = 0; i < lista.length; i += 2) {
    const local = lista[i];
    const visitante = lista[i + 1];
    if (!local || !visitante) break;
    cruces.push({
      equipo_local_id: local.equipo_id,
      equipo_visitante_id: visitante.equipo_id,
      numero_partido: cruces.length + 1,
    });
  }
  return cruces;
}

function validarCrucesManuales(
  cruces: CrucePropuesto[],
  equiposPermitidos: Set<number>
): void {
  const usadosEnFecha = new Set<number>();

  for (const cruce of cruces) {
    if (cruce.equipo_local_id === cruce.equipo_visitante_id) {
      throw new Error("Un cruce no puede tener el mismo equipo como local y visitante.");
    }
    if (!equiposPermitidos.has(cruce.equipo_local_id)) {
      throw new Error(`Equipo local ${cruce.equipo_local_id} no está permitido en el cuadro.`);
    }
    if (!equiposPermitidos.has(cruce.equipo_visitante_id)) {
      throw new Error(
        `Equipo visitante ${cruce.equipo_visitante_id} no está permitido en el cuadro.`
      );
    }
    if (usadosEnFecha.has(cruce.equipo_local_id)) {
      throw new Error("Un equipo aparece más de una vez en los cruces de playoff.");
    }
    if (usadosEnFecha.has(cruce.equipo_visitante_id)) {
      throw new Error("Un equipo aparece más de una vez en los cruces de playoff.");
    }
    usadosEnFecha.add(cruce.equipo_local_id);
    usadosEnFecha.add(cruce.equipo_visitante_id);
  }
}

export async function generarEtapaPlayoffs(
  torneoId: number,
  cantidadClasificados: number,
  formato: FormatoPlayoff = "estandar",
  clasificadosManual?: number[],
  crucesManual?: CrucePropuesto[]
): Promise<ResultadoGeneracionPlayoffs> {
  if (cantidadClasificados < 2 || cantidadClasificados % 2 !== 0) {
    throw new Error("La cantidad de clasificados debe ser un número par mayor o igual a 2.");
  }

  const tabla = await obtenerTablaPosiciones(torneoId);
  if (tabla.length < cantidadClasificados) {
    throw new Error(
      "No hay suficientes equipos en la tabla para la cantidad de clasificados solicitada."
    );
  }

  const topTabla = tabla.slice(0, cantidadClasificados);
  const mapaTabla = new Map(tabla.map((fila, indice) => [fila.equipo_id, indice + 1]));

  let clasificados: ClasificadoPlayoff[];

  if (clasificadosManual && clasificadosManual.length > 0) {
    if (clasificadosManual.length !== cantidadClasificados) {
      throw new Error(
        "La lista manual de clasificados debe tener la misma cantidad que cantidad_clasificados."
      );
    }
    const idsUnicos = new Set(clasificadosManual);
    if (idsUnicos.size !== clasificadosManual.length) {
      throw new Error("Hay equipos repetidos en la lista de clasificados.");
    }

    clasificados = clasificadosManual.map((equipoId, indice) => {
      const fila = tabla.find((f) => f.equipo_id === equipoId);
      if (!fila) {
        throw new Error(`El equipo ${equipoId} no pertenece al torneo/tabla actual.`);
      }
      return {
        posicion: mapaTabla.get(equipoId) ?? indice + 1,
        equipo_id: equipoId,
        nombre: fila.nombre,
        pts: fila.pts,
      };
    });
  } else {
    clasificados = topTabla.map((fila, indice) => ({
      posicion: indice + 1,
      equipo_id: fila.equipo_id,
      nombre: fila.nombre,
      pts: fila.pts,
    }));
  }

  const equiposPermitidos = new Set(tabla.map((fila) => fila.equipo_id));

  let cruces: CrucePropuesto[];
  if (crucesManual && crucesManual.length > 0) {
    validarCrucesManuales(crucesManual, equiposPermitidos);
    cruces = numerarCruces(crucesManual);
  } else {
    cruces = armarCrucesPlayoff(clasificados, formato);
  }

  const partidosTorneo = await listarPartidosTorneo(torneoId);

  return {
    numero_fecha_sugerido: siguienteNumeroFecha(partidosTorneo),
    clasificados,
    cruces,
  };
}
