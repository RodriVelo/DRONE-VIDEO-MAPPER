import express from "express";
import cors from "cors";
import { checkConnection } from "./db/connection.js";
import createAllTables from "./db/dbUtils.js";
import authRoutes from "./routes/authRoutes.js"
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import userRoutes from "./routes/userRoutes.js";
import panelAdminRoutes from "./routes/panelAdminRoutes.js"


const app = express();
app.use(passport.initialize());

app.use(cors({
                origin: process.env.CLIENT_URL,
                credentials: true,
              }));

app.use(express.json());
app.use(cookieParser());

app.use(`/auth`, authRoutes);
app.use(`/user`, userRoutes);
app.use(`/panelAdmin`, panelAdminRoutes)

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
 
  try {
    await checkConnection();
    await createAllTables();
  } catch (error) {
    console.log("Failed to initialize the database", error);
  }
});
