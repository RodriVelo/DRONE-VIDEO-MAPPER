import { pool } from "../db/connection.js";

export const getUserModel = async (id) => {

  try {

    const [rows] = await pool.query(
      "SELECT id, nombre, apellido, nro_documento, email, telefono, estado FROM usuario WHERE id = ?",
      [id]
    );

    return rows[0];

  } catch (error) {
    throw error;
  }
};
export const updateUserModel = async (userId, userData) => {

  const { nombre, apellido, email,nro_documento, telefono } = userData;

  const [result] = await pool.query(
    `UPDATE usuario
     SET nombre = ?,
         apellido = ?,
         email = ?,
         nro_documento= ?,
         telefono = ?
     WHERE id = ?`,
    [nombre, apellido, email, nro_documento, telefono, userId]
  );

  return result;
};


