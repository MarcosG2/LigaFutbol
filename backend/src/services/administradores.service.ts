import { createHash } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/db.js";
import type {
  DatosActualizarAdministrador,
  DatosCrearAdministrador,
} from "../schemas/administradores.schema.js";
import type { AdministradorPublico } from "../types/entidades.js";

const columnasSelectPublico = "id, usuario";

function hashearPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function buscarAdministradorPublicoPorId(
  id: number
): Promise<AdministradorPublico | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelectPublico} FROM Administradores WHERE id = ?`,
    [id]
  );
  return filas.length > 0 ? (filas[0] as AdministradorPublico) : null;
}

export async function validarCredenciales(
  usuario: string,
  password: string
): Promise<AdministradorPublico | null> {
  const password_hash = hashearPassword(password);
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelectPublico} FROM Administradores WHERE usuario = ? AND password_hash = ?`,
    [usuario, password_hash]
  );
  return filas.length > 0 ? (filas[0] as AdministradorPublico) : null;
}

export async function listarAdministradores(): Promise<AdministradorPublico[]> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT ${columnasSelectPublico} FROM Administradores ORDER BY usuario ASC`
  );
  return filas as AdministradorPublico[];
}

export async function obtenerAdministradorPorId(
  id: number
): Promise<AdministradorPublico | null> {
  return buscarAdministradorPublicoPorId(id);
}

export async function crearAdministrador(
  datos: DatosCrearAdministrador
): Promise<AdministradorPublico> {
  const password_hash = hashearPassword(datos.password);

  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO Administradores (usuario, password_hash) VALUES (?, ?)`,
    [datos.usuario, password_hash]
  );

  const administrador = await buscarAdministradorPublicoPorId(resultado.insertId);
  if (!administrador) {
    throw new Error("No se pudo recuperar el administrador creado");
  }
  return administrador;
}

export async function actualizarAdministrador(
  id: number,
  datos: DatosActualizarAdministrador
): Promise<AdministradorPublico | null> {
  const asignaciones: string[] = [];
  const valores: string[] = [];

  if (datos.usuario !== undefined) {
    asignaciones.push("usuario = ?");
    valores.push(datos.usuario);
  }
  if (datos.password !== undefined) {
    asignaciones.push("password_hash = ?");
    valores.push(hashearPassword(datos.password));
  }

  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE Administradores SET ${asignaciones.join(", ")} WHERE id = ?`,
    [...valores, id]
  );

  if (resultado.affectedRows === 0) {
    return null;
  }

  return buscarAdministradorPublicoPorId(id);
}

export async function eliminarAdministrador(id: number): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `DELETE FROM Administradores WHERE id = ?`,
    [id]
  );
  return resultado.affectedRows > 0;
}
