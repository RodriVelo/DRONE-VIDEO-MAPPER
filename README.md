# 🔐 Login & Signup Template

Plantilla Full Stack desarrollada con React, Node.js, Express y MySQL que implementa un sistema completo de autenticación y autorización basado en JWT.

El proyecto fue creado como una base reutilizable para futuros desarrollos, incorporando buenas prácticas de seguridad, arquitectura MVC y autenticación tradicional junto con OAuth de Google.

---

## 🚀 Tecnologías Utilizadas

### Frontend
- React
- React Router DOM
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- JWT (JSON Web Token)
- bcrypt
- OAuth Google
- Middleware de autenticación

### Base de Datos
- MySQL

### Arquitectura
- MVC (Model - View - Controller)

---

## ✨ Funcionalidades

### Autenticación

- Registro de usuarios.
- Inicio de sesión con email y contraseña.
- Inicio de sesión con Google OAuth.
- Registro mediante cuenta Google.
- Generación de tokens JWT.
- Persistencia de sesión.
- Protección de rutas privadas.
- Verificación de autenticación mediante middleware.

### Gestión de Usuario

- Visualización de perfil.
- Edición de perfil.
- Actualización de información del usuario.

### Seguridad

- Hash de contraseñas utilizando bcrypt.
- Validación de credenciales.
- Verificación de tokens JWT.
- Variables de entorno para información sensible.
- Middleware de autorización.

---

## 📂 Estructura del Proyecto

```bash
LOGIN-SIGNUP/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── config/
│   └── package.json
│
└── README.md
```

---

## 🗄️ Base de Datos

Actualmente el proyecto cuenta con las siguientes entidades:

### Usuario
- id
- nombre
- email
- contraseña
- proveedor de autenticación
- rol

### Rol
- id
- nombre

---

## 🔒 Flujo de Autenticación

1. El usuario se registra o inicia sesión.
2. La contraseña se almacena hasheada con bcrypt.
3. El servidor genera un JWT.
4. El token es enviado al cliente.
5. Las rutas protegidas verifican el token mediante middleware.
6. Solo usuarios autenticados pueden acceder a recursos privados.

---

## ⚙️ Instalación

### Clonar repositorio

```bash
git clone https://github.com/RodriVelo/LOGIN-SIGNUP.git
```

### Instalar dependencias del Frontend

```bash
cd client
npm install
```

### Instalar dependencias del Backend

```bash
cd server
npm install
```

### Configurar Variables de Entorno

Crear un archivo `.env` dentro de la carpeta `server`.

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tu_base_de_datos

JWT_SECRET=tu_clave_secreta

GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
```

---

## ▶️ Ejecutar el Proyecto

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

---

## 🎯 Objetivo del Proyecto

Este proyecto fue desarrollado como una plantilla reutilizable para futuros sistemas Full Stack, permitiendo comenzar nuevos desarrollos con una base sólida de autenticación, autorización y estructura de código organizada.

Puede ser utilizado como punto de partida para:

- E-commerce.
- Sistemas de gestión.
- Redes sociales.
- Dashboards administrativos.
- Aplicaciones SaaS.
- Sistemas de reservas.
- Blogs y plataformas de contenido.

---

## 🚧 Mejoras Futuras

- Recuperación de contraseña.
- Verificación de email.
- Cambio de contraseña.
- Subida de imagen de perfil.
- Sistema de permisos por roles.
- Refresh Tokens.
- Dashboard de administración.
- Auditoría de sesiones.

---

## 👨‍💻 Autor

**Rodrigo Veloso**

GitHub:
https://github.com/RodriVelo

Repositorio:
https://github.com/RodriVelo/LOGIN-SIGNUP

---

⭐ Proyecto desarrollado como base reutilizable para aplicaciones Full Stack modernas.