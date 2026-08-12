import { useState, useEffect } from "react";
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

const formatFecha = (fechaStr) => {
  if (!fechaStr) return "—";
  const [year, month, day] = fechaStr.split("-");
  return `${day}/${month}/${year}`;
};

const formatPrecio = (v) =>
  v != null
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
    : "—";

export default function NavegadorModalHistorial() {
  const [reservas, setReservas] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCanchaId, setFiltroCanchaId] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  useEffect(() => {
    const getData = async () => {
      try {
        const [resReservas, resCanchas] = await Promise.all([
          axios.get(`${API}/panelAdmin/getHistorial`),
          axios.get(`${API}/canchas/getCanchas`),
        ]);
        if (resReservas.data.success) setReservas(resReservas.data.historial);
        if (resCanchas.data.success) setCanchas(resCanchas.data.canchas);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const filtradas = reservas.filter((r) => {
    const matchCancha = filtroCanchaId ? r.cancha_id === Number(filtroCanchaId) : true;
    const matchEstado = filtroEstado ? r.estado === filtroEstado : true;
    return matchCancha && matchEstado;
  });

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-zinc-800 flex-wrap">
        <h2 className="text-sm font-bold text-white">Historial de reservas</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filtroCanchaId}
            onChange={(e) => setFiltroCanchaId(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-500 transition-colors cursor-pointer"
          >
            <option value="">Todas las canchas</option>
            {canchas.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-500 transition-colors cursor-pointer"
          >
            <option value="">Todos los estados</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-zinc-500">
          <span className="text-3xl">📋</span>
          <p className="text-sm">No hay reservas con estos filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Fecha", "Cliente", "Cancha", "Horario", "Estado", "Monto"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((r) => (
                <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-5 py-3 text-zinc-400 tabular-nums">{formatFecha(r.fecha)}</td>
                  <td className="px-5 py-3 text-zinc-300">{r.nombre} {r.apellido}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400">
                      {r.cancha_nombre}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-400 tabular-nums">{r.horario_inicio} hs</td>
                  <td className="px-5 py-3"><BadgeEstado estado={r.estado} /></td>
                  <td className="px-5 py-3 font-semibold text-zinc-100">
                    {r.estado === "confirmada" ? formatPrecio(r.precio) : <span className="text-zinc-600">—</span>}
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