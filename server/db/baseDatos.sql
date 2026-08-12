CREATE DATABASE IF NOT EXISTS nombrebasededatos;
USE nombrebasededatos;




-- =========================
-- TABLA ROL 
-- =========================

CREATE TABLE IF NOT EXISTS rol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TABLA USUARIO
-- =========================

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

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================
-- TABLA CANCHA
-- =========================

CREATE TABLE IF NOT EXISTS cancha (
    id INT AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    tipo ENUM(
        'futbol5',
        'futbol7',
        'futbol11'
    ) DEFAULT 'futbol5',

    precio DECIMAL(10,2) NOT NULL,

    activa BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TABLA TURNO
-- =========================

CREATE TABLE IF NOT EXISTS turno (
    id INT AUTO_INCREMENT PRIMARY KEY,

    cancha_id INT NOT NULL,

    fecha DATE NOT NULL,

    horario_inicio TIME NOT NULL,
    horario_fin TIME NOT NULL,

    estado ENUM(
        'disponible',
        'reservado',
        'bloqueado',
        'cancelado'
    ) DEFAULT 'disponible',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_turno_cancha
        FOREIGN KEY (cancha_id)
        REFERENCES cancha(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE (cancha_id, fecha, horario_inicio)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TABLA RESERVA
-- =========================

CREATE TABLE IF NOT EXISTS reserva (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,
    turno_id INT NOT NULL,

    estado ENUM(
        'pendiente',
        'confirmada',
        'cancelada'
    ) DEFAULT 'pendiente',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_reserva_turno
        FOREIGN KEY (turno_id)
        REFERENCES turno(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE (turno_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

