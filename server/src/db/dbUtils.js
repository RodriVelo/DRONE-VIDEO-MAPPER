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

const membresiaTableQuery = `
CREATE TABLE IF NOT EXISTS membresia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL,
    duracion_dias INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const usuarioMembresiaTableQuery = `
CREATE TABLE IF NOT EXISTS usuario_membresia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_membresia INT NOT NULL,

    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    estado ENUM('activa', 'vencida', 'cancelada') NOT NULL DEFAULT 'activa',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_um_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_um_membresia
        FOREIGN KEY (id_membresia)
        REFERENCES membresia(id)
        ON DELETE RESTRICT,

    INDEX idx_um_usuario_estado (id_usuario, estado)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const pagoTableQuery = `
CREATE TABLE IF NOT EXISTS pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_membresia INT NOT NULL,

    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) DEFAULT 'mercadopago',

    mp_preference_id VARCHAR(255),
    mp_payment_id VARCHAR(255) UNIQUE,
    mp_status VARCHAR(50),
    mp_status_detail VARCHAR(100),

    estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_pago_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pago_membresia
        FOREIGN KEY (id_membresia)
        REFERENCES membresia(id)
        ON DELETE RESTRICT

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

const insertDefaultMembresias = async () => {
  try {

    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM membresia"
    );

    if (rows[0].count === 0) {

      await pool.query(`
        INSERT INTO membresia (nombre, descripcion, precio, duracion_dias)
        VALUES
          ('mensual', 'Acceso completo por 30 días', 5000.00, 30),
          ('anual', 'Acceso completo por 365 días', 45000.00, 365)
      `);

      console.log("✅ Membresías insertadas");

    } else {

      console.log("ℹ️ Las membresías ya existen");

    }

  } catch (error) {

    console.log("❌ Error insertando membresías:", error);

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

    await createTable("membresia", membresiaTableQuery);

    await insertDefaultMembresias();

    await createTable("usuario_membresia", usuarioMembresiaTableQuery);

    await createTable("pago", pagoTableQuery);

    console.log("✅ Todas las tablas listas");

  } catch (error) {

    console.error("❌ Error general DB");
    console.error(error.message);

  }
};
export default createAllTables;