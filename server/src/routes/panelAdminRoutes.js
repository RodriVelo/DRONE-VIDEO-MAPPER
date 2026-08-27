import express from "express";

import {
  getStats,
  getUsers,
  cambiarEstadoUsuario,
  editarPerfilUsuario,
  eliminarUsuario,
} from "../controllers/panelAdminUsersController.js";
import { authenticateToken, authorize} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getStats", authenticateToken, authorize("admin"), getStats);
router.get("/getUsers", authenticateToken, authorize("admin"), getUsers);
router.patch("/users/:id/cambiarEstado", authenticateToken, authorize("admin"), cambiarEstadoUsuario);
router.patch("/users/:id/editarPerfil", authenticateToken, authorize("admin"), editarPerfilUsuario);
router.delete("/users/:id/eliminarUsuario", authenticateToken, authorize("admin"), eliminarUsuario);

export default router;
