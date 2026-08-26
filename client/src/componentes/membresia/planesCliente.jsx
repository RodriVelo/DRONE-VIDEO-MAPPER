import { useState } from "react";
import axios from "axios";
import {
  CalendarCheck,
  CalendarDays,
  Check,
  Lock,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const BENEFICIOS = [
  "Acceso completo a VideoMap",
  "Acceso completo al FOV Calibrador",
  "Soporte prioritario",
];

export default function PlanesCliente({ planes, membresia, vinoRedirigido }) {
  const [procesando, setProcesando] = useState(null); // id del plan que se está pagando
  const [error, setError] = useState(null);

  const suscribirse = async (idMembresia) => {
    try {
      setProcesando(idMembresia);
      setError(null);

      const response = await axios.post(
        `${API}/membresia/crear-preferencia`,
        { idMembresia },
        { withCredentials: true }
      );

      if (response.data.success && response.data.initPoint) {
        window.location.href = response.data.initPoint;
      } else {
        throw new Error("No se recibió el link de pago");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar el pago. Intentá nuevamente.");
      setProcesando(null);
    }
  };

  const formatearPrecio = (precio) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(precio);

  return (
    <>
      <div className="text-center mb-12">
        {vinoRedirigido && (
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-medium">
            <Lock size={14} />
            Necesitás una membresía activa para acceder a esa sección
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Elegí tu membresía
        </h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          Desbloqueá VideoMap y el FOV Calibrador con acceso completo a la
          plataforma.
        </p>

        {membresia && (
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10 text-[#4ade80] text-xs font-medium">
            <ShieldCheck size={14} />
            Ya tenés una membresía activa hasta el{" "}
            {new Date(membresia.fecha_fin).toLocaleDateString("es-AR")}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {planes.map((plan) => {
          const esAnual = plan.nombre === "anual";
          const precioMensualEquivalente = esAnual ? plan.precio / 12 : null;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border px-8 py-10 flex flex-col ${
                esAnual
                  ? "border-[#4ade80]/40 bg-[oklch(21%_0.006_285.885)] shadow-lg shadow-[#4ade80]/10"
                  : "border-slate-800 bg-[oklch(21%_0.006_285.885)]"
              }`}
            >
              {esAnual && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#4ade80] text-white text-[11px] font-bold tracking-wide uppercase">
                  Más conveniente
                </span>
              )}

              <div className="w-12 h-12 rounded-2xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center mb-6">
                {esAnual ? (
                  <CalendarCheck size={20} className="text-[#4ade80]" />
                ) : (
                  <CalendarDays size={20} className="text-[#4ade80]" />
                )}
              </div>

              <h3 className="text-lg font-bold text-white capitalize">
                Plan {plan.nombre}
              </h3>
              <p className="mt-1 text-slate-500 text-sm">
                {plan.descripcion}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  {formatearPrecio(plan.precio)}
                </span>
                <span className="text-slate-500 text-sm">
                  / {plan.duracion_dias >= 365 ? "año" : "mes"}
                </span>
              </div>

              {precioMensualEquivalente && (
                <p className="mt-1 text-[#4ade80] text-xs font-medium">
                  Equivale a {formatearPrecio(precioMensualEquivalente)} por
                  mes
                </p>
              )}

              <div className="w-full h-px bg-slate-800 my-6" />

              <ul className="space-y-3 flex-1">
                {BENEFICIOS.map((beneficio) => (
                  <li
                    key={beneficio}
                    className="flex items-start gap-2.5 text-sm text-slate-300"
                  >
                    <Check size={16} className="text-[#4ade80] shrink-0 mt-0.5" />
                    {beneficio}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => suscribirse(plan.id)}
                disabled={procesando !== null}
                className={`mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:active:scale-100 ${
                  esAnual
                    ? "bg-[#4ade80] hover:brightness-110 text-white shadow-lg shadow-[#4ade80]/20"
                    : "bg-white/[0.06] hover:bg-white/[0.1] text-white border border-slate-700"
                }`}
              >
                {procesando === plan.id ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Redirigiendo a Mercado Pago...
                  </>
                ) : (
                  "Suscribirme"
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-slate-600 text-xs mt-10">
        Pagos procesados de forma segura por Mercado Pago. Podés cancelar
        cuando quieras.
      </p>
    </>
  );
}