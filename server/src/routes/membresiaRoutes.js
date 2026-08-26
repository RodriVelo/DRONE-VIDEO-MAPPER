import express from "express";

import {
  getPlanes,
  getMiMembresia,
  getHistorial,
  crearPreferencia,
  webhook,
  editarPlan,
  eliminarMembresia,
  crearPlan
} from "../controllers/membresiaController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rutas privadas (usuario logueado)
router.get("/planes", authenticateToken, getPlanes);
router.get("/mi-membresia", authenticateToken, getMiMembresia);
router.get("/historial", authenticateToken, getHistorial);
router.post("/crear-preferencia", authenticateToken, crearPreferencia);


router.put("/admin/editar-plan/:id", authenticateToken, editarPlan)
router.delete("/admin/eliminar-membresia/:id", authenticateToken, eliminarMembresia)
router.post("/admin/crear-plan", authenticateToken, crearPlan)
// Ruta pública: la llama el servidor de Mercado Pago, no el usuario.
// express.json() ya está montado global en app.js, MP manda JSON.
router.post("/webhook", webhook);

export default router;
