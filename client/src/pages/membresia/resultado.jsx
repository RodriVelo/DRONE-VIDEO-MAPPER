import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle2,
  Clock,
  LoaderCircle,
  XCircle,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

// Cuántas veces reintenta consultar si la membresía ya se activó
// (el webhook de MP puede tardar unos segundos en llegar).
const MAX_INTENTOS = 6;
const INTERVALO_MS = 2000;

export default function ResultadoMembresia() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const estado = searchParams.get("estado"); // success | failure | pending

  const [activa, setActiva] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const intentos = useRef(0);

  useEffect(() => {
    if (estado !== "success") {
      setVerificando(false);
      return;
    }

    let cancelado = false;

    const verificar = async () => {
      try {
        const response = await axios.get(`${API}/membresia/mi-membresia`, {
          withCredentials: true,
        });

        if (cancelado) return;

        if (response.data.activa) {
          setActiva(true);
          setVerificando(false);
          return;
        }
      } catch (err) {
        console.error(err);
      }

      intentos.current += 1;

      if (intentos.current >= MAX_INTENTOS) {
        if (!cancelado) setVerificando(false);
        return;
      }

      setTimeout(verificar, INTERVALO_MS);
    };

    verificar();

    return () => {
      cancelado = true;
    };
  }, [estado]);

  let contenido;

  if (estado === "success" && verificando) {
    contenido = (
      <>
        <div className="w-16 h-16 rounded-2xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
          <LoaderCircle className="w-8 h-8 text-[#4ade80] animate-spin" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-white text-center">
          Confirmando tu pago...
        </h1>
        <p className="mt-2 text-slate-400 text-sm text-center max-w-sm">
          Mercado Pago está confirmando la operación. Esto suele tardar unos
          segundos.
        </p>
      </>
    );
  } else if (estado === "success" && activa) {
    contenido = (
      <>
        <div className="w-16 h-16 rounded-2xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#4ade80]" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-white text-center">
          ¡Membresía activada!
        </h1>
        <p className="mt-2 text-slate-400 text-sm text-center max-w-sm">
          Tu pago fue aprobado. Ya tenés acceso completo a la plataforma.
        </p>
        <button
          onClick={() => navigate("/aplicacion")}
          className="mt-8 px-6 py-3 rounded-xl bg-[#4ade80] hover:brightness-110 transition-all duration-200 font-semibold text-white shadow-lg shadow-[#4ade80]/20 active:scale-95"
        >
          Ir a VideoMap
        </button>
      </>
    );
  } else if (estado === "success" && !activa) {
    contenido = (
      <>
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Clock className="w-8 h-8 text-yellow-400" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-white text-center">
          Tu pago está en revisión
        </h1>
        <p className="mt-2 text-slate-400 text-sm text-center max-w-sm">
          Mercado Pago todavía no confirmó la operación. Puede tardar unos
          minutos más — la membresía se activa sola apenas se confirme, sin
          que tengas que hacer nada.
        </p>
        <button
          onClick={() => navigate("/perfil")}
          className="mt-8 px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-slate-700 transition-all duration-200 font-semibold text-white active:scale-95"
        >
          Ir a mi perfil
        </button>
      </>
    );
  } else if (estado === "pending") {
    contenido = (
      <>
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Clock className="w-8 h-8 text-yellow-400" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-white text-center">
          Pago pendiente
        </h1>
        <p className="mt-2 text-slate-400 text-sm text-center max-w-sm">
          Tu pago quedó pendiente de aprobación (por ejemplo, pago en
          efectivo). Te avisaremos apenas se acredite y tu membresía se
          activará automáticamente.
        </p>
        <button
          onClick={() => navigate("/perfil")}
          className="mt-8 px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-slate-700 transition-all duration-200 font-semibold text-white active:scale-95"
        >
          Ir a mi perfil
        </button>
      </>
    );
  } else {
    contenido = (
      <>
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-white text-center">
          No pudimos procesar el pago
        </h1>
        <p className="mt-2 text-slate-400 text-sm text-center max-w-sm">
          El pago fue rechazado o cancelado. Podés intentarlo de nuevo cuando
          quieras.
        </p>
        <button
          onClick={() => navigate("/planes")}
          className="mt-8 px-6 py-3 rounded-xl bg-[#4ade80] hover:brightness-110 transition-all duration-200 font-semibold text-white shadow-lg shadow-[#4ade80]/20 active:scale-95"
        >
          Volver a intentar
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(14.8%_0.004_228.8)] flex items-center justify-center overflow-hidden relative">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#4ade80]/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#4ade80]/10 blur-3xl rounded-full" />

      <div className="relative z-10 flex flex-col items-center rounded-3xl border border-slate-800 bg-[oklch(21%_0.006_285.885)] px-10 py-12 max-w-md w-full mx-4">
        {contenido}
      </div>
    </div>
  );
}
