import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type {
  DatosActualizarEquipo,
  DatosCrearEquipo,
  JugadorPlantillaEquipo,
  JugadorPlantillaSincronizar,
} from "../schemas/equipos.schema.js";
import type { Equipo, Jugador } from "../types/entidades.js";

export class ErrorPlantillaEquipo extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorPlantillaEquipo";
  }
}

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

async function insertarEquipoConPlantilla(
  datos: Omit<DatosCrearEquipo, "jugadores">,
  jugadores: JugadorPlantillaEquipo[]
): Promise<Equipo> {
  const { nombre, escudo_url, instagram, estado } = datos;
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [resultadoEquipo] = await conexion.execute<ResultSetHeader>(
      `INSERT INTO Equipos (nombre, escudo_url, instagram, estado) VALUES (?, ?, ?, ?)`,
      [nombre, escudo_url, instagram, estado]
    );

    const equipoId = resultadoEquipo.insertId;

    const filasInsert = jugadores.map((jugador) => [
      equipoId,
      jugador.nombre,
      jugador.numero_camiseta,
      null,
    ]);

    await conexion.query(
      `INSERT INTO Jugadores (equipo_id, nombre, numero_camiseta, goles) VALUES ?`,
      [filasInsert]
    );

    await conexion.commit();

    const [filasEquipo] = await pool.execute<RowDataPacket[]>(
      `SELECT ${columnasSelect} FROM Equipos WHERE id = ?`,
      [equipoId]
    );

    if (filasEquipo.length === 0) {
      throw new Error("No se pudo recuperar el equipo creado");
    }

    return filasEquipo[0] as Equipo;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function crearEquipo(datos: DatosCrearEquipo): Promise<Equipo> {
  const { jugadores, ...datosEquipo } = datos;

  if (jugadores && jugadores.length > 0) {
    return insertarEquipoConPlantilla(datosEquipo, jugadores);
  }

  const { nombre, escudo_url, instagram, estado } = datosEquipo;

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

export async function sincronizarPlantillaEquipo(
  equipoId: number,
  jugadores: JugadorPlantillaSincronizar[]
): Promise<Jugador[] | null> {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [filasEquipo] = await conexion.execute<RowDataPacket[]>(
      `SELECT id FROM Equipos WHERE id = ? FOR UPDATE`,
      [equipoId]
    );

    if (filasEquipo.length === 0) {
      await conexion.rollback();
      return null;
    }

    const [filasActuales] = await conexion.execute<RowDataPacket[]>(
      `SELECT id, equipo_id, nombre, numero_camiseta, goles
       FROM Jugadores
       WHERE equipo_id = ?
       FOR UPDATE`,
      [equipoId]
    );

    const actuales = filasActuales as Jugador[];
    const idsActuales = new Set(actuales.map((jugador) => jugador.id));
    const porId = new Map(actuales.map((jugador) => [jugador.id, jugador]));

    for (const jugador of jugadores) {
      if (jugador.id !== undefined && !idsActuales.has(jugador.id)) {
        throw new ErrorPlantillaEquipo("Hay un jugador que no pertenece a este equipo");
      }
    }

    const idsConservados = new Set(
      jugadores.flatMap((jugador) => (jugador.id !== undefined ? [jugador.id] : []))
    );
    const idsAEliminar = actuales
      .map((jugador) => jugador.id)
      .filter((id) => !idsConservados.has(id));

    if (idsAEliminar.length > 0) {
      const marcadores = idsAEliminar.map(() => "?").join(", ");
      await conexion.execute(
        `DELETE FROM Jugadores WHERE equipo_id = ? AND id IN (${marcadores})`,
        [equipoId, ...idsAEliminar]
      );
    }

    for (const jugador of jugadores) {
      if (jugador.id === undefined) continue;

      const actual = porId.get(jugador.id);
      if (!actual) continue;
      if (actual.nombre === jugador.nombre && actual.numero_camiseta === jugador.numero_camiseta) {
        continue;
      }

      await conexion.execute(
        `UPDATE Jugadores SET nombre = ?, numero_camiseta = ? WHERE id = ? AND equipo_id = ?`,
        [jugador.nombre, jugador.numero_camiseta, jugador.id, equipoId]
      );
    }

    const nuevos = jugadores.filter((jugador) => jugador.id === undefined);
    if (nuevos.length > 0) {
      const filasInsert = nuevos.map((jugador) => [
        equipoId,
        jugador.nombre,
        jugador.numero_camiseta,
        0,
      ]);

      await conexion.query(
        `INSERT INTO Jugadores (equipo_id, nombre, numero_camiseta, goles) VALUES ?`,
        [filasInsert]
      );
    }

    const [filasResultado] = await conexion.execute<RowDataPacket[]>(
      `SELECT id, equipo_id, nombre, numero_camiseta, goles
       FROM Jugadores
       WHERE equipo_id = ?
       ORDER BY numero_camiseta ASC, nombre ASC`,
      [equipoId]
    );

    await conexion.commit();
    return filasResultado as Jugador[];
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
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
