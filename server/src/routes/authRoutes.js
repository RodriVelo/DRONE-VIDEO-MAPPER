import express from "express";
import passport from "passport";

import {
  userRegister,
  userLogin,
  googleCallback,
} from "../controllers/authController.js";

import { hashPassword } from "../middleware/hashPassword.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/user-register", hashPassword, userRegister);

router.post("/login", userLogin);

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.json({
    message: "Sesión cerrada",
  });
});

router.get("/me", authenticateToken, (req, res) => {

  res.json({
    success: true,
    user: req.user,
  });
});

// GOOGLE AUTH

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`
  }),
  googleCallback,
);

export default router;
