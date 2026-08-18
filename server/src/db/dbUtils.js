import { pool } from "./connection.js";

const rolTableQuery = `
CREATE TABLE IF NOT EXISTS rol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const usuarioTableQuery = `
CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,

    nro_documento VARCHAR(20) UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(30) UNIQUE,

    contrasena VARCHAR(255),

    google_id VARCHAR(255) UNIQUE,

    id_rol INT NOT NULL DEFAULT 2,
    estado ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const insertDefaultRoles = async () => {
  try {

    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM rol"
    );

    if (rows[0].count === 0) {

      await pool.query(`
        INSERT INTO rol (tipo)
        VALUES ('admin'), ('cliente')
      `);

      console.log("✅ Roles insertados");

    } else {

      console.log("ℹ️ Los roles ya existen");

    }

  } catch (error) {

    console.log("❌ Error insertando roles:", error);

  }
};

const createTable = async (tableName, query) => {
  try {

    await pool.query(query);

    console.log(`✅ ${tableName} creada o ya existe`);

  } catch (error) {

    console.error(`❌ Error creando ${tableName}`);
    console.error(error.message);

  }
};


const createAllTables = async () => {
  try {

    await createTable("rol", rolTableQuery);

    await insertDefaultRoles();

    await createTable("usuario", usuarioTableQuery);

    console.log("✅ Todas las tablas listas");

  } catch (error) {

    console.error("❌ Error general DB");
    console.error(error.message);

  }
};
export default createAllTables;