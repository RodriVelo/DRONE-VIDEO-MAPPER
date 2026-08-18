import jwt from "jsonwebtoken";
import { pool } from "../db/connection.js"; // ajustá el path

export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No autenticado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      `SELECT estado FROM usuario WHERE id = ?`,
      [decoded.id]
    );

    if (!rows[0]) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    // Solo bloquea acá a los dados de baja. "suspendido" pasa normalmente.
    if (rows[0].estado === "inactivo") {
      return res.status(403).json({
        success: false,
        message: "Tu cuenta está inactiva. Contactá al administrador.",
      });
    }

    req.user = { ...decoded, estado: rows[0].estado };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder",
      });
    }
    next();
  };
};