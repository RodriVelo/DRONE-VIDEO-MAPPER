import { useState } from "react";
import { toast } from "react-toastify";
import { Mail, MessageCircle, Send, User, MessageSquare } from "lucide-react";

// Sin endpoint de backend todavía: arma un mailto: con lo cargado en el
// formulario. Cuando exista POST /contacto en el server, reemplazar
// handleSubmit por un axios.post y dejar el mailto como fallback opcional.
const EMAIL_CONTACTO = "contacto@dronevideomapper.com";

const Contacto = () => {
  const [formValues, setFormValues] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [enviando, setEnviando] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!formValues.nombre.trim()) errors.nombre = "Ingresá tu nombre";
    if (!formValues.email.trim()) {
      errors.email = "Ingresá tu email";
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      errors.email = "Ingresá un email válido";
    }
    if (!formValues.mensaje.trim()) {
      errors.mensaje = "Contanos qué necesitás";
    } else if (formValues.mensaje.trim().length < 10) {
      errors.mensaje = "Contanos un poco más (mínimo 10 caracteres)";
    }
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Revisá los campos marcados");
      return;
    }

    setEnviando(true);

    const subject = encodeURIComponent(`Contacto de ${formValues.nombre}`);
    const body = encodeURIComponent(
      `${formValues.mensaje}\n\n— ${formValues.nombre} (${formValues.email})`
    );

    window.location.href = `mailto:${EMAIL_CONTACTO}?subject=${subject}&body=${body}`;

    toast.success("Se abrió tu cliente de correo para enviar el mensaje");
    setEnviando(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0f1016]">
      {/* ---------- Panel izquierdo: identidad de marca ---------- */}
      <div className="relative hidden lg:flex lg:w-[46%] items-center justify-center overflow-hidden bg-[#0E2818]">
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

        <div className="absolute top-16 right-16 w-24 h-24 rounded-full border border-white/20" />
        <div className="absolute top-24 right-28 w-3 h-3 rounded-full bg-white/40" />
        <div className="absolute bottom-24 left-14 w-2 h-2 rounded-full bg-white/40" />

        <div className="relative z-10 max-w-sm px-10 text-white">
          <div className="flex items-center gap-2 mb-10">
            <span className="w-8 h-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-sm font-bold">
              ◆
            </span>
            <span className="text-xs tracking-[0.25em] text-white/70 uppercase">
              DRONE VIDEO MAPPER
            </span>
          </div>

          <p className="text-white/60 text-sm mb-2">Hablemos</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] mb-6">
            CONTACTO
          </h1>
          <div className="h-1 w-14 bg-[#4ade80] rounded-full mb-6" />
          <p className="text-white/70 text-sm leading-relaxed">
            Dudas, soporte técnico o algo puntual que te falte en la
            plataforma — contanos y te respondemos.
          </p>

          <div className="mt-10 flex flex-col gap-3 text-sm">
            <a
              href={`mailto:${EMAIL_CONTACTO}`}
              className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors"
            >
              <Mail size={16} className="text-[#4ade80]" />
              {EMAIL_CONTACTO}
            </a>
            <a
              href="https://wa.me/5492990000000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors"
            >
              <MessageCircle size={16} className="text-[#4ade80]" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ---------- Panel derecho: formulario ---------- */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-8 h-8 rounded-lg bg-[#0B2A4A] text-white flex items-center justify-center text-sm font-bold">
              ◆
            </span>
            <span className="text-xs tracking-[0.25em] text-[#0B2A4A]/70 uppercase font-medium">
              DRONE VIDEO MAPPER
            </span>
          </div>

          <h2 className="text-3xl font-bold text-[#4ade80] mb-2">Contacto</h2>
          <p className="text-slate-500 text-sm mb-8">
            Escribinos y te respondemos a la brevedad
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre"
                  value={formValues.nombre}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border ${
                    formErrors.nombre
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/15"
                  }`}
                />
              </div>
              {formErrors.nombre && (
                <p className="mt-1.5 text-xs text-red-500">{formErrors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="tu@correo.com"
                  value={formValues.email}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border ${
                    formErrors.email
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/15"
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1.5 text-xs text-red-500">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Mensaje
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  name="mensaje"
                  rows={5}
                  placeholder="Contanos qué necesitás"
                  value={formValues.mensaje}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border resize-none ${
                    formErrors.mensaje
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/15"
                  }`}
                />
              </div>
              {formErrors.mensaje && (
                <p className="mt-1.5 text-xs text-red-500">
                  {formErrors.mensaje}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4ade80] py-3 font-semibold text-white shadow-lg shadow-[#0B2A4A]/20 transition-all duration-200 hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar mensaje"}
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-xs leading-relaxed">
            También podés escribirnos directamente a{" "}
            <a
              href={`mailto:${EMAIL_CONTACTO}`}
              className="font-semibold text-[#4ade80] hover:underline"
            >
              {EMAIL_CONTACTO}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contacto;