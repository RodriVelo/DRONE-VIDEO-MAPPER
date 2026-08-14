import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, User } from "lucide-react";

export default function PerfilEdit({ userData, onSave, onCancel, loading, avisoTelefono }) {

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    nro_documento: "",
    telefono: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userData) {
      setFormData({
        nombre: String(userData.nombre || ""),
        apellido: String(userData.apellido || ""),
        email: String(userData.email || ""),
        nro_documento: String(userData.nro_documento || ""),
        telefono: String(userData.telefono || ""),
      });
    }
  }, [userData]);

  const validateForm = () => {
    const newErrors = {};
    if (!String(formData.nombre || "").trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!String(formData.apellido || "").trim()) newErrors.apellido = "El apellido es obligatorio";
    const email = String(formData.email || "").trim();
    if (!email) newErrors.email = "El email es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Formato de email inválido";
    const dni = String(formData.nro_documento || "").trim();
    if (!dni) newErrors.nro_documento = "El DNI es obligatorio";
    else if (!/^\d{8}$/.test(dni)) newErrors.nro_documento = "El DNI debe tener 8 dígitos";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: String(value || "") }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onSave(formData);
    else toast.error("Por favor corregí los errores en el formulario");
  };

  const inputClass = (field) => `
    w-full rounded-xl border bg-[oklch(21%_0.006_285.885)] px-4 py-3
    text-white text-sm placeholder:text-slate-600 outline-none transition-all duration-200
    focus:ring-2 focus:ring-red-500/20
    ${errors[field] ? "border-red-500/60" : "border-slate-800 focus:border-red-500/40"}
  `;

  const initials = `${formData.nombre?.[0] || ""}${formData.apellido?.[0] || ""}`;
  const nombreCompleto = `${formData.nombre} ${formData.apellido}`.trim();

  return (
    <div className="min-h-screen bg-[oklch(14.8%_0.004_228.8)] overflow-hidden relative">
      {/* Glow background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#4ade80]/15 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4ade80]/10 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

          {/* Panel izquierdo: contexto */}
          <div className="lg:sticky lg:top-16 lg:self-start flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Editar perfil</h1>
              <p className="mt-1 text-slate-500 text-sm">Actualizá tus datos personales</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-[oklch(21%_0.006_285.885)] px-8 py-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#4ade80] flex items-center justify-center text-white text-2xl font-black tracking-tight shadow-lg shadow-[#4ade80]/30">
                {initials || <User size={26} />}
              </div>
              <p className="mt-5 text-white text-base font-bold truncate max-w-full">
                {nombreCompleto || "Sin nombre"}
              </p>
              <p className="mt-1 text-slate-600 text-xs truncate max-w-full">
                {formData.email || "Sin email"}
              </p>
            </div>

            {avisoTelefono && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <span className="text-amber-400 text-sm">
                  Completá tu teléfono y DNI para poder hacer reservas.
                </span>
              </div>
            )}
          </div>

          {/* Panel derecho: formulario */}
          <div className="rounded-3xl border border-slate-800 bg-[oklch(21%_0.006_285.885)] p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Nombre + Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 uppercase tracking-widest">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    className={inputClass("nombre")}
                  />
                  {errors.nombre && <span className="text-red-400 text-xs">{errors.nombre}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 uppercase tracking-widest">Apellido *</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    placeholder="Tu apellido"
                    className={inputClass("apellido")}
                  />
                  {errors.apellido && <span className="text-red-400 text-xs">{errors.apellido}</span>}
                </div>
              </div>

              {/* Email + DNI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 uppercase tracking-widest">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    placeholder="correo@ejemplo.com"
                    className={`${inputClass("email")} opacity-40 cursor-not-allowed`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 uppercase tracking-widest">D.N.I *</label>
                  <input
                    type="text"
                    name="nro_documento"
                    maxLength="8"
                    value={formData.nro_documento}
                    onChange={handleInputChange}
                    placeholder="12345678"
                    className={inputClass("nro_documento")}
                  />
                  {errors.nro_documento && <span className="text-red-400 text-xs">{errors.nro_documento}</span>}
                </div>
              </div>

              {/* Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 uppercase tracking-widest">Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="2991234567"
                    className={inputClass("telefono")}
                  />
                  {errors.telefono && <span className="text-red-400 text-xs">{errors.telefono}</span>}
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full sm:w-auto sm:min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-400 transition-all duration-200 font-semibold text-white shadow-lg shadow-red-500/20 active:scale-95 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-200 font-semibold active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}