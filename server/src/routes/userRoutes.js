import express from "express";
import { getUser , updateUser } from "../controllers/userController.js"
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getUser",authenticateToken,getUser)
router.put("/updateUser", authenticateToken, updateUser);



export default router;