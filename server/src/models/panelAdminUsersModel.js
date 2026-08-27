import { pool } from "../db/connection.js"

export const getStatsModel = async () => {
  try {
    const [[{ totalUsuarios }]] = await pool.query(
      `SELECT COUNT(*) as totalUsuarios FROM usuario`,
    );

    const hoy = new Date().toISOString().split("T")[0];

    const [[{ reservasHoy }]] = await pool.query(
      `SELECT COUNT(*) as reservasHoy
       FROM reserva r
       JOIN turno t ON r.turno_id = t.id
       WHERE t.fecha = ? AND r.estado = "confirmada"`,
      [hoy],
    );

    const [[{ turnosLibresHoy }]] = await pool.query(
      `SELECT COUNT(*) as turnosLibresHoy
            FROM turno t
            JOIN cancha c ON t.cancha_id = c.id
            WHERE t.fecha = ? 
                AND t.estado = 'disponible'
                AND c.activa = 1`,
      [hoy],
    );

    const [[{ ingresosMes }]] = await pool.query(
      `SELECT COALESCE(SUM(c.precio), 0) as ingresosMes
       FROM reserva r
       JOIN turno t ON r.turno_id = t.id
       JOIN cancha c ON t.cancha_id = c.id
       WHERE MONTH(t.fecha) = MONTH(CURDATE())
         AND YEAR(t.fecha) = YEAR(CURDATE())
         AND r.estado = 'confirmada'`,
    );

    return { totalUsuarios, reservasHoy, turnosLibresHoy, ingresosMes };
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