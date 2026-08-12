// middlewares/hashPassword.js
import bcrypt from "bcrypt";

export const hashPassword = async (req, res, next) => {
  try {
    if (req.body.contrasena) {
      req.body.contrasena = await bcrypt.hash(req.body.contrasena, 10);
    }

    next();
  } catch (error) {
    next(error);
  }
};