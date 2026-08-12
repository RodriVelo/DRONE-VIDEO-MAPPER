import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

function Spinner() {
  return <div className="w-5 h-5 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />;
}

const formatPrecio = (v) =>
  v != null
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
    : "—";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export default function NavegadorModalIngresos() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getIngresos = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/panelAdmin/getIngresos`, { params: { mes, anio } });
        if (res.data.success) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getIngresos();
  }, [mes, anio]);

  const maxIngreso = data?.porCancha?.length
    ? Math.max(...data.porCancha.map((c) => c.total))
    : 1;

  const anios = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-zinc-800 flex-wrap">
        <h2 className="text-sm font-bold text-white">Ingresos</h2>
        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-500 transition-colors cursor-pointer"
          >
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-500 transition-colors cursor-pointer"
          >
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !data ? (
        <div className="flex flex-col items-center gap-2 py-16 text-zinc-500">
          <p className="text-sm">No hay datos para este período</p>
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-5">
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Total del mes", value: formatPrecio(data.totalMes), color: "text-white" },
              { label: "Reservas confirmadas", value: data.totalReservas ?? "—", color: "text-emerald-400" },
              { label: "Promedio por reserva", value: formatPrecio(data.promedioPorReserva), color: "text-zinc-300" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1.5">{label}</p>
                <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Barras por cancha */}
          {data.porCancha?.length > 0 && (
            <div className="bg-zinc-800/40 border border-zinc-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Por cancha</p>
              <div className="flex flex-col gap-3">
                {data.porCancha.map((c) => {
                  const pct = maxIngreso > 0 ? (c.total / maxIngreso) * 100 : 0;
                  return (
                    <div key={c.cancha_id} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-24 shrink-0 truncate">{c.cancha_nombre}</span>
                      <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-300 w-24 text-right shrink-0">
                        {formatPrecio(c.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}