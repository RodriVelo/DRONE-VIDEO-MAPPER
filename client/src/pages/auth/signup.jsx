import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { User, IdCard, Mail, Phone, Lock, ArrowRight } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const SignUp = () => {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    nombre: "",
    apellido: "",
    email: "",
    nro_documento: "",
    telefono: "",
    contrasena: "",
    confirmar_contrasena: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // Nombre
    if (!formValues.nombre?.trim()) {
      errors.nombre = "El nombre es obligatorio";
    } else if (formValues.nombre.trim().length < 2) {
      errors.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (
      !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(formValues.nombre.trim())
    ) {
      errors.nombre = "El nombre solo puede contener letras";
    }

    // Apellido
    if (!formValues.apellido?.trim()) {
      errors.apellido = "El apellido es obligatorio";
    } else if (formValues.apellido.trim().length < 2) {
      errors.apellido = "El apellido debe tener al menos 2 caracteres";
    } else if (
      !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(formValues.apellido.trim())
    ) {
      errors.apellido = "El apellido solo puede contener letras";
    }

    // Email
    if (!formValues.email?.trim()) {
      errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim())) {
      errors.email = "Ingrese un email válido";
    }

    // DNI
    if (!formValues.nro_documento?.trim()) {
      errors.nro_documento = "El DNI es obligatorio";
    } else if (!/^\d{7,8}$/.test(formValues.nro_documento.trim())) {
      errors.nro_documento = "El DNI debe tener 7 u 8 dígitos";
    }

    // Teléfono
    if (!formValues.telefono?.trim()) {
      errors.telefono = "El teléfono es obligatorio";
    } else if (!/^\+?[\d\s\-()]{8,15}$/.test(formValues.telefono.trim())) {
      errors.telefono = "Ingrese un teléfono válido";
    }

    // Contraseña
    if (!formValues.contrasena) {
      errors.contrasena = "Ingrese una contraseña";
    } else if (formValues.contrasena.length < 8) {
      errors.contrasena = "Mínimo 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formValues.contrasena)) {
      errors.contrasena = "Debe incluir mayúsculas, minúsculas y números";
    }

    if (!formValues.confirmar_contrasena) {
      errors.confirmar_contrasena = "Confirme su contraseña";
    } else if (formValues.contrasena !== formValues.confirmar_contrasena) {
      errors.confirmar_contrasena = "Las contraseñas no coinciden";
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Por favor corrige los errores");
      return;
    }

    try {
      const { confirmar_contrasena, ...dataToSend } = formValues;
      const { data } = await axios.post(
        `${API}/auth/user-register`,
        dataToSend,
      );
      if (data.success) {
        toast.success("Usuario registrado correctamente");

        setFormValues({
          nombre: "",
          apellido: "",
          email: "",
          nro_documento: "",
          telefono: "",
          contrasena: "",
          confirmar_contrasena: "",
        });

        navigate("/login");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Algo salió mal. Intenta nuevamente.",
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* ---------- Panel izquierdo: identidad de marca ---------- */}
      <div className="relative hidden lg:flex lg:w-[42%] items-center justify-center overflow-hidden bg-[#0E2818]">
        {/* Ondas de fondo */}
        <svg
          className="absolute inset-0 w-full h-full opacity-90"
          viewBox="0 0 600 900"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveA" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#3bad65" />
            </linearGradient>
            <linearGradient id="waveB" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#65ff9d" />
              <stop offset="100%" stopColor="#2c7e4a" />
            </linearGradient>
          </defs>
          <path
            d="M0,300 C150,380 250,220 400,260 C500,285 550,200 600,220 L600,0 L0,0 Z"
            fill="url(#waveA)"
            opacity="0.55"
          />
          <path
            d="M0,520 C180,600 300,460 450,500 C520,520 560,470 600,480 L600,900 L0,900 Z"
            fill="url(#waveB)"
            opacity="0.45"
          />
          <path
            d="M0,650 C200,700 260,600 420,640 C520,665 560,610 600,630 L600,900 L0,900 Z"
            fill="#205b36"
          />
        </svg>

        {/* Puntos decorativos */}
        <div className="absolute top-16 right-16 w-24 h-24 rounded-full border border-white/20" />
        <div className="absolute top-24 right-28 w-3 h-3 rounded-full bg-white/40" />
        <div className="absolute bottom-24 left-14 w-2 h-2 rounded-full bg-white/40" />

        {/* Contenido */}
        <div className="relative z-10 max-w-sm px-10 text-white">
          <div className="flex items-center gap-2 mb-10">
            <span className="w-8 h-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-sm font-bold">
              ◆
            </span>
            <span className="text-xs tracking-[0.25em] text-white/70 uppercase">
              DRONE VIDEO MAPPER
            </span>
          </div>

          <p className="text-white/60 text-sm mb-2">Empecemos de cero</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] mb-6">
            CREA TU
            <br />
            CUENTA
          </h1>
          <div className="h-1 w-14 bg-[#4ade80] rounded-full mb-6" />
          <p className="text-white/70 text-sm leading-relaxed">
            Completa tus datos para registrarte y empezar a usar la
            plataforma en minutos.
          </p>
        </div>
      </div>

      {/* ---------- Panel derecho: formulario ---------- */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Logo visible solo en mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-8 h-8 rounded-lg bg-[#0E2818] text-white flex items-center justify-center text-sm font-bold">
              ◆
            </span>
            <span className="text-xs tracking-[0.25em] text-[#0E2818]/70 uppercase font-medium">
              DRONE VIDEO MAPPER
            </span>
          </div>

          <h2 className="text-3xl font-bold text-[#0E2818] mb-2">
            Registrarse
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Crea tu cuenta para comenzar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre + Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Ingrese su nombre"
                    value={formValues.nombre}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border ${
                      formErrors.nombre
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 focus:border-[#3bad65] focus:ring-2 focus:ring-[#4ade80]/20"
                    }`}
                  />
                </div>
                {formErrors.nombre && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {formErrors.nombre}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Apellido
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="apellido"
                    placeholder="Ingrese su apellido"
                    value={formValues.apellido}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border ${
                      formErrors.apellido
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 focus:border-[#3bad65] focus:ring-2 focus:ring-[#4ade80]/20"
                    }`}
                  />
                </div>
                {formErrors.apellido && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {formErrors.apellido}
                  </p>
                )}
              </div>
            </div>

            {/* DNI */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                D.N.I
              </label>
              <div className="relative">
                <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="nro_documento"
                  placeholder="Ingrese su D.N.I"
                  value={formValues.nro_documento}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border ${
                    formErrors.nro_documento
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-slate-200 focus:border-[#3bad65] focus:ring-2 focus:ring-[#4ade80]/20"
                  }`}
                />
              </div>
              {formErrors.nro_documento && (
                <p className="mt-1.5 text-xs text-red-500">
                  {formErrors.nro_documento}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Ingrese su email"
                  value={formValues.email}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border ${
                    formErrors.email
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-slate-200 focus:border-[#3bad65] focus:ring-2 focus:ring-[#4ade80]/20"
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1.5 text-xs text-red-500">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Telefono */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="telefono"
                  placeholder="Ingrese su teléfono"
                  value={formValues.telefono}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border ${
                    formErrors.telefono
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-slate-200 focus:border-[#3bad65] focus:ring-2 focus:ring-[#4ade80]/20"
                  }`}
                />
              </div>
              {formErrors.telefono && (
                <p className="mt-1.5 text-xs text-red-500">
                  {formErrors.telefono}
                </p>
              )}
            </div>

            {/* Password + Confirmar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    name="contrasena"
                    placeholder="••••••••"
                    value={formValues.contrasena}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border ${
                      formErrors.contrasena
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 focus:border-[#3bad65] focus:ring-2 focus:ring-[#4ade80]/20"
                    }`}
                  />
                </div>
                {formErrors.contrasena && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {formErrors.contrasena}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Confirmar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    name="confirmar_contrasena"
                    placeholder="Repita su contraseña"
                    value={formValues.confirmar_contrasena}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border ${
                      formErrors.confirmar_contrasena
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 focus:border-[#3bad65] focus:ring-2 focus:ring-[#4ade80]/20"
                    }`}
                  />
                </div>
                {formErrors.confirmar_contrasena && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {formErrors.confirmar_contrasena}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0E2818] py-3 font-semibold text-white shadow-lg shadow-[#0E2818]/20 transition-all duration-200 hover:bg-[#163a24] active:scale-[0.98]"
            >
              Registrarse
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500 text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#3bad65] hover:underline"
            >
              Ingresar
            </Link>
          </p>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">O continúa con</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <a
            href={`${API}/auth/google`}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6 7l6.2 5.2C39.9 36.6 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z" />
            </svg>
            <span>Continuar con Google</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignUp;