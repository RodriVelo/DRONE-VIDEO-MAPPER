import { getMembresiaActivaModel } from "../models/membresiaModels.js";

// Se usa DESPUÉS de authenticateToken en las rutas que requieren
// membresía paga. Los admin (rol) pasan siempre.
export const requiereMembresia = async (req, res, next) => {
  try {
    if (req.user.rol === "admin") {
      return next();
    }

    const membresia = await getMembresiaActivaModel(req.user.id);

    if (!membresia) {
      return res.status(403).json({
        success: false,
        message: "Necesitás una membresía activa para acceder a esta sección",
        code: "MEMBRESIA_REQUERIDA",
      });
    }

    req.membresia = membresia;
    next();
  } catch (error) {
    console.error("Error verificando membresía:", error);
    res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};
