import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

function Spinner() {
  return <div className="w-5 h-5 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />;
}

const formatFecha = (fechaStr) => {
  if (!fechaStr) return "—";
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
};

const formatPrecio = (v) =>
  v != null
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
    : "—";

const formatHace = (fechaStr) => {
  if (!fechaStr) return "—";
  const diff = Math.floor((Date.now() - new Date(fechaStr).getTime()) / 60000);
  if (diff < 60) return `hace ${diff} min`;
  if (diff < 1440) return `hace ${Math.floor(diff / 60)} hs`;
  return `hace ${Math.floor(diff / 1440)} días`;
};

export default function NavegadorModalPendientes() {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await axios.get(`${API}/panelAdmin/getReservasPendientes`);
        if (res.data.success) setPendientes(res.data.pendientes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-bold text-white">Reservas pendientes de pago</h2>
        {pendientes.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
            {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : pendientes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-zinc-500">
          <span className="text-3xl">✅</span>
          <p className="text-sm">No hay reservas pendientes de pago</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Cliente", "Cancha", "Fecha", "Horario", "Monto", "Iniciado"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendientes.map((r) => (
                <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-zinc-200 font-medium">{r.nombre} {r.apellido}</p>
                   {r.telefono && (
                     <a
                    href={`https://wa.me/${r.telefono}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                    {r.telefono}
                </a>
                )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400">
                      {r.cancha_nombre}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-400 tabular-nums">{formatFecha(r.fecha)}</td>
                  <td className="px-5 py-3 text-zinc-400 tabular-nums">{r.horario_inicio} hs</td>
                  <td className="px-5 py-3 font-semibold text-zinc-100">{formatPrecio(r.precio)}</td>
                  <td className="px-5 py-3 text-zinc-500 text-xs">{formatHace(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}