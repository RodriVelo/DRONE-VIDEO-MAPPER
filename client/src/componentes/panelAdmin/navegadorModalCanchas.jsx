import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

function Spinner() {
  return <div className="w-5 h-5 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />;
}

export default function NavegadorModalCanchas() {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await axios.get(`${API}/panelAdmin/getOcupacionCanchas`);
        if (res.data.success) setCanchas(res.data.canchas);
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
        <h2 className="text-sm font-bold text-white">Ocupación de canchas — hoy</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : canchas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-zinc-500">
          <span className="text-3xl">🏟️</span>
          <p className="text-sm">No hay canchas registradas</p>
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-3">
          {canchas.map((c) => {
            const ocupados = Number(c.reservados) + Number(c.bloqueados);
           const pct = Number(c.totalTurnos) > 0 ? Math.round((ocupados / Number(c.totalTurnos)) * 100) : 0;

            return (
              <div key={c.id} className="bg-zinc-800/40 border border-zinc-700 rounded-xl p-4 flex flex-col gap-3">
                {/* Nombre y badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">{c.nombre}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                      c.activa
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-zinc-700 border-zinc-600 text-zinc-500"
                    }`}>
                      {c.activa ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-zinc-300">{pct}% ocupada</span>
                </div>

                {/* Barra */}
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {c.libres} libres
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    {c.reservados} reservados
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                    {c.bloqueados} bloqueados
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}