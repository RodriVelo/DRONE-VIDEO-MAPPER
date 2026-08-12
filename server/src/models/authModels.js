import { pool } from "../db/connection.js";
import { comparePassword } from "../utils/passwordUtils.js";

// Register User
export const userRegisterModel = async (user) => {

  try {
    // 1) Chequear usuario existente
    const [existingUser] = await pool.query(
      "SELECT id FROM usuario WHERE email = ? OR nro_documento = ?",
      [user.email, user.nro_documento],
    );

    if (existingUser.length > 0) {
      return { success: false, message: "El usuario ya existe." };
    }

    // 4) Insertar usuario (rol cliente = 2)
    const [result] = await pool.query(
      `INSERT INTO usuario 
        (nombre, apellido, email, nro_documento, telefono, contrasena, id_rol)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.nombre,
        user.apellido,
        user.email,
        user.nro_documento,
        user.telefono,
        user.contrasena,
        2,
      ],
    );

    return { success: true, message: "Usuario registrado correctamente" };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: "Falló el registro. Por favor, inténtelo nuevamente.",
    };
  }
};

export const userLoginModel = async (email, contrasena) => {
  try {
    const [rows] = await pool.query(
          `SELECT 
            usuario.id,
            usuario.nombre,
            usuario.apellido,
            usuario.email,
            usuario.contrasena,
            usuario.telefono,
            usuario.google_id,
            usuario.estado,
            rol.tipo AS rol
          FROM usuario
          JOIN rol ON usuario.id_rol = rol.id
          WHERE usuario.email = ?`,
          [email]
        );

    if (rows.length === 0) {
      return {
        success: false,
        message: "Usuario no encontrado.",
      };
    }
    
    const user = rows[0];

    if (!user.contrasena && user.google_id) {
    return {
      success: false,
      message: "Esta cuenta fue creada con Google",
    };
  }

    const isValidPassword = await comparePassword(contrasena, user.contrasena);

    if (!isValidPassword) {
      return {
        success: false,
        message: "Contraseña incorrecta",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Login error:", error);

    return {
      success: false,
      message: "Error en login",
    };
  }
};
