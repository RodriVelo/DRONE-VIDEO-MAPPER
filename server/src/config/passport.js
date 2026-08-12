import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { pool } from "../db/connection.js";


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        const nombreCompleto = profile.displayName;

        const partes = nombreCompleto.split(" ");

        const nombre = partes[0];
        const apellido = partes.slice(1).join(" ");

        // buscar usuario existente
        const [rows] = await pool.query(
          `
          SELECT 
            usuario.id,
            usuario.nombre,
            usuario.apellido,
            usuario.email,
            usuario.telefono,
            usuario.estado,
            rol.tipo AS rol
          FROM usuario
          JOIN rol ON usuario.id_rol = rol.id
          WHERE usuario.email = ?
          `,
          [email]
        );

        let user;

        // si existe -> login
        if (rows.length > 0) {
          user = rows[0];
        } else {
          // crear usuario nuevo
          const [result] = await pool.query(
            `
            INSERT INTO usuario
            (
              nombre,
              apellido,
              email,
              google_id,
              id_rol
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
              nombre,
              apellido,
              email,
              profile.id,
              2,
            ]
          );

          user = {
            id: result.insertId,
            nombre,
            apellido,
            email,
            rol: "cliente",
          };
        }

        done(null, user);

      } catch (error) {
        console.log(error);
        done(error, null);
      }
    }
  )
);

export default passport;