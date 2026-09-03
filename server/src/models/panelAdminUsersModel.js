import { pool } from "../db/connection.js"

export const getStatsModel = async () => {
  try {
    const [[{ totalUsuarios }]] = await pool.query(
      `SELECT COUNT(*) as totalUsuarios FROM usuario`,
    );

    const hoy = new Date().toISOString().split("T")[0];


 
    return { totalUsuarios };
  } catch (error) {
    throw error;
  }
};

export const getUsersModel = async () => {

  try {
    const [rows] = await pool.query(
      `SELECT
          u.id,
          u.nombre,
          u.apellido,
          u.nro_documento,
          u.email,
          u.telefono,
          u.estado,
          r.tipo AS rol
      FROM usuario u
      JOIN rol r ON u.id_rol = r.id`,
    );

    return rows;
  } catch (error) {
    throw error;
  }
};

export const cambiarEstadoUsuarioModel = async (id,nuevoEstado) =>{
    try {
        await pool.query(`
            UPDATE usuario
            SET estado = ?
            WHERE id = ?`,[nuevoEstado,id])
    } catch (error) {
        throw(error)
    }
}

export const editarPerfilUsuarioModel = async (id,nuevoPerfil) =>{
    try {
        await pool.query(
            `UPDATE usuario
            SET nombre=?,apellido=?,email=?, telefono=?, id_rol=?, nro_documento=?
            WHERE id=?`,
            [nuevoPerfil.nombre, nuevoPerfil.apellido, nuevoPerfil.email, nuevoPerfil.telefono, nuevoPerfil.rol, nuevoPerfil.nro_documento, id]
        )
    } catch (error) {
        throw(error)
    }
}

export const eliminarUsuarioModel = async (id) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM usuario WHERE id = ?`,
      [id]
    );
    return { success: true };
  } catch (error) {
    throw error;
  }
};