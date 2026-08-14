import express from "express";
import {
  getStats,
  getUsers,
  eliminarUsuario,
} from "../controllers/panelAdminController.js";
import {
  cambiarEstadoUsuario,
  editarPerfilUsuario,
} from "../controllers/panelAdminUsersController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(`/getStats`, authenticateToken, getStats);
router.get("/getUsers", authenticateToken, getUsers);

router.patch(
  "/users/:id/cambiarEstado",
  authenticateToken,
  cambiarEstadoUsuario,
);
router.patch("/users/:id/editarPerfil", authenticateToken, editarPerfilUsuario);
router.delete("/users/:id/eliminarUsuario", authenticateToken, eliminarUsuario);

export default router;
