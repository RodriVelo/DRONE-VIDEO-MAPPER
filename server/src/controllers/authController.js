import { userRegisterModel, userLoginModel } from "../models/authModels.js";
import { generateToken } from "../utils/jwtUtils.js";
import jwt from "jsonwebtoken";

export const userRegister = async (req, res) => {
  const { nombre, apellido, email, nro_documento, telefono, contrasena } =
    req.body;

  if (
    !nombre ||
    !apellido ||
    !email ||
    !nro_documento ||
    !telefono ||
    !contrasena
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Debe rellenar todos los campos." });
  }

  // Create user instance
  const user = {
    nombre,
    apellido,
    email,
    nro_documento,
    telefono,
    contrasena,
  };

  try {
    // Register user using auth service
    const response = await userRegisterModel(user);
    if (response.success) {
      return res.status(201).json(response);
    } else {
      return res.status(400).json(response);
    }
  } catch (error) {
    console.error("Error in user registration:", error);
    return res.status(500).json({
      success: false,
      message: "Falló el registro. Por favor, inténtelo de nuevo más tarde.",
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    const result = await userLoginModel(email, contrasena);

    // 👇 ACÁ va la validación
    if (!result.success) {
        const status = result.message.includes("Google") ? 403 : 401;
        return res.status(status).json({ message: result.message });
      }

      if (result.user.estado !== 'activo') {
        return res.status(403).json({ 
          success: false, 
          message: "Tu cuenta está suspendida. Contactá al administrador." 
        });
      }
          // recién si todo está OK seguís acá
    const token = generateToken({
      id: result.user.id,
      nombre: result.user.nombre,
      apellido: result.user.apellido,
      email: result.user.email,
      rol: result.user.rol,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const { contrasena: _, ...userWithoutPassword } = result.user;

    return res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};
export const googleCallback = async (req, res) => {
  try {
    // ← verificar estado antes de generar token
    if (req.user.estado !== 'activo') {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=suspendido`);
    }

    const token = jwt.sign(
      {
        id: req.user.id,
        nombre: req.user.nombre,
        apellido: req.user.apellido,
        email: req.user.email,
        rol: req.user.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    if (!req.user.telefono) {
      return res.redirect(`${process.env.CLIENT_URL}/perfil`);
    }

    res.redirect(process.env.CLIENT_URL);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error autenticando con Google" });
  }
};