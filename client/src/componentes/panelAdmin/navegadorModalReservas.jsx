import { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

function Spinner() {
  return <div className="w-5 h-5 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />;
}

function BadgeEstado({ estado }) {
  const esConfirmada = estado === "confirmada";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
      esConfirmada
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        : "bg-red-500/10 border-red-500/20 text-red-400"
    }`}>
      {esConfirmada ? "Confirmada" : "Cancelada"}
    </span>
  );
}

function ModalReserva({ reserva, onClose }) {
  if (!reserva) return null;
  const campos = [
    { label: "Cliente", value: `${reserva.nombre} ${reserva.apellido}` },
    { label: "Teléfono", value: reserva.telefono ?? "—" },
    { label: "Cancha", value: reserva.cancha_nombre ?? "—" },
    { label: "Horario", value: `${reserva.horario_inicio} hs` },
    { label: "Estado", value: <BadgeEstado estado={reserva.estado} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Detalle de reserva</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl divide-y divide-zinc-700 text-sm">
          {campos.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-4 py-3 gap-4">
              <span className="text-zinc-400 shrink-0">{label}</span>
              <span className="text-white font-semibold text-right">{value}</span>
            </div>
          ))}
        </div>

        {reserva.telefono && (
          <a
            href={`https://wa.me/${reserva.telefono}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 font-bold rounded-xl text-sm text-center transition-all"
          >
            Contactar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default function NavegadorModalReservas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  useEffect(() => {
    const getReservas = async () => {
      try {
        const hoy = new Date().toISOString().split("T")[0];
        const res = await axios.get(`${API}/panelAdmin/getReservasHoy`, { params: { fecha: hoy } });
        if (res.data.success) 
          
          setReservas(res.data.reservas);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getReservas();
  }, []);

  const confirmadas = reservas.filter((r) => r.estado === "confirmada").length;
  const canceladas = reservas.filter((r) => r.estado === "cancelada").length;

  return (
    <>
      {reservaSeleccionada && (
        <ModalReserva reserva={reservaSeleccionada} onClose={() => setReservaSeleccionada(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-zinc-800 flex-wrap">
        <h2 className="text-sm font-bold text-white">Reservas de hoy</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
            {confirmadas} confirmadas
          </span>
          {canceladas > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold">
              {canceladas} canceladas
            </span>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : reservas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-zinc-500">
          <span className="text-3xl">📅</span>
          <p className="text-sm">No hay reservas para hoy</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Hora", "Cliente", "Cancha", "Estado", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-5 py-3 font-semibold text-zinc-100 tabular-nums">{r.horario_inicio} hs</td>
                  <td className="px-5 py-3 text-zinc-300">{r.nombre} {r.apellido}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400">
                      {r.cancha_nombre}
                    </span>
                  </td>
                  <td className="px-5 py-3"><BadgeEstado estado={r.estado} /></td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setReservaSeleccionada(r)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-semibold transition-all duration-150"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}