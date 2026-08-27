import { pool } from "../db/connection.js";

// ================= PLANES =================

export const getPlanesModel = async () => {
  const [rows] = await pool.query(
    `SELECT id, nombre, descripcion, precio, duracion_dias, activo
     FROM membresia
     ORDER BY precio ASC`
  );
  return rows;
};

export const getPlanByIdModel = async (idMembresia) => {
  const [rows] = await pool.query(
    `SELECT id, nombre, descripcion, precio, duracion_dias
     FROM membresia
     WHERE id = ? AND activo = TRUE`,
    [idMembresia]
  );
  return rows[0];
};

// ================= ADMIN =================

export const editarPlanModel = async (body) => {
  const [resultado] = await pool.query(
    `UPDATE membresia
     SET nombre = ?,
         descripcion = ?,
         precio = ?,
         duracion_dias = ?,
         activo = ?
     WHERE id = ?`,
    [
      body.nombre,
      body.descripcion,
      body.precio,
      body.duracion_dias,
      body.activo,
      body.id,
    ]
  );
  return resultado;
};

export const eliminarMembresiaModel = async (id) =>{
  const res = await pool.query(`
    DELETE FROM membresia
    WHERE id = ?`, 
  [id])
  return res;
}

export const crearPlanModel = async (membresia) => {
  const [res] = await pool.query(
    `
    INSERT INTO membresia (nombre, descripcion, precio, duracion_dias)
    VALUES (?, ?, ?, ?)
    `,
    [membresia.nombre, membresia.descripcion, membresia.precio, membresia.duracion_dias]
  );

  return {
    id: res.insertId,
    nombre: membresia.nombre,
    descripcion: membresia.descripcion,
    precio: membresia.precio,
    duracion_dias: membresia.duracion_dias,
    activo: true,
  };
};

// ================= MEMBRESÍA DEL USUARIO =================

export const getMembresiaActivaModel = async (idUsuario) => {
  const [rows] = await pool.query(
    `SELECT um.id, um.fecha_inicio, um.fecha_fin, um.estado,
            m.id AS id_membresia, m.nombre, m.descripcion, m.precio
     FROM usuario_membresia um
     JOIN membresia m ON um.id_membresia = m.id
     WHERE um.id_usuario = ?
       AND um.estado = 'activa'
       AND um.fecha_fin > NOW()
     ORDER BY um.fecha_fin DESC
     LIMIT 1`,
    [idUsuario]
  );
  return rows[0] || null;
};

export const getHistorialMembresiasModel = async (idUsuario) => {
  const [rows] = await pool.query(
    `SELECT um.id, um.fecha_inicio, um.fecha_fin, um.estado,
            m.nombre, m.precio
     FROM usuario_membresia um
     JOIN membresia m ON um.id_membresia = m.id
     WHERE um.id_usuario = ?
     ORDER BY um.created_at DESC`,
    [idUsuario]
  );
  return rows;
};

// Crea o extiende la membresía activa del usuario para el plan pagado.
// Si ya tiene una activa vigente, la nueva se apila a partir de la fecha_fin actual.
export const activarMembresiaModel = async (idUsuario, idMembresia) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [planRows] = await conn.query(
      `SELECT duracion_dias FROM membresia WHERE id = ?`,
      [idMembresia]
    );

    if (planRows.length === 0) {
      throw new Error("Plan de membresía inexistente");
    }

    const duracionDias = planRows[0].duracion_dias;

    const [activaRows] = await conn.query(
      `SELECT id, fecha_fin FROM usuario_membresia
       WHERE id_usuario = ? AND estado = 'activa' AND fecha_fin > NOW()
       ORDER BY fecha_fin DESC LIMIT 1`,
      [idUsuario]
    );

    const fechaInicio =
      activaRows.length > 0 ? activaRows[0].fecha_fin : new Date();

    const [result] = await conn.query(
      `INSERT INTO usuario_membresia (id_usuario, id_membresia, fecha_inicio, fecha_fin, estado)
       VALUES (?, ?, ?, DATE_ADD(?, INTERVAL ? DAY), 'activa')`,
      [idUsuario, idMembresia, fechaInicio, fechaInicio, duracionDias]
    );

    await conn.commit();
    return result.insertId;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// ================= PAGOS =================

export const crearPagoPendienteModel = async ({
  idUsuario,
  idMembresia,
  monto,
  mpPreferenceId,
}) => {
  const [result] = await pool.query(
    `INSERT INTO pago (id_usuario, id_membresia, monto, mp_preference_id, estado)
     VALUES (?, ?, ?, ?, 'pendiente')`,
    [idUsuario, idMembresia, monto, mpPreferenceId]
  );
  return result.insertId;
};

export const getPagoByPreferenceIdModel = async (mpPreferenceId) => {
  const [rows] = await pool.query(
    `SELECT * FROM pago WHERE mp_preference_id = ?`,
    [mpPreferenceId]
  );
  return rows[0];
};

export const getPagoByMpPaymentIdModel = async (mpPaymentId) => {
  const [rows] = await pool.query(
    `SELECT * FROM pago WHERE mp_payment_id = ?`,
    [mpPaymentId]
  );
  return rows[0];
};

export const actualizarPagoModel = async ({
  idPago,
  mpPaymentId,
  mpStatus,
  mpStatusDetail,
  estado,
}) => {
  const [result] = await pool.query(
    `UPDATE pago
     SET mp_payment_id = ?,
         mp_status = ?,
         mp_status_detail = ?,
         estado = ?
     WHERE id = ?`,
    [mpPaymentId, mpStatus, mpStatusDetail, estado, idPago]
  );
  return result;
};

export const getHistorialPagosModel = async (idUsuario) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.monto, p.metodo_pago, p.estado, p.mp_status, p.created_at,
            m.nombre AS membresia
     FROM pago p
     JOIN membresia m ON p.id_membresia = m.id
     WHERE p.id_usuario = ?
     ORDER BY p.created_at DESC`,
    [idUsuario]
  );
  return rows;
};
