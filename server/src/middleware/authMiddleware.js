import jwt from "jsonwebtoken";
import { pool } from "../db/connection.js"; // ajustá el path

export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No autenticado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar estado en BD
    const [rows] = await pool.query(
      `SELECT estado FROM usuario WHERE id = ?`,
      [decoded.id]
    );

    if (!rows[0] || rows[0].estado !== 'activo') {
      return res.status(403).json({ 
        success: false, 
        message: "Tu cuenta está suspendida. Contactá al administrador." 
      });
    }

    req.user = decoded;
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