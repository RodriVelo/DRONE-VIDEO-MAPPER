import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../../utils/authContext";
import PlanesCliente from "../../componentes/membresia/planesCliente";
import PlanesAdmin from "../../componentes/membresia/planesAdmin";

const API = import.meta.env.VITE_API_URL;

export default function Planes() {
  const location = useLocation();
  const { user } = useAuth();

  const esAdmin = user?.rol === "admin";
  const vinoRedirigido = Boolean(location.state?.from);

  const [planes, setPlanes] = useState([]);
  const [membresia, setMembresia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);

        const [resPlanes, resMembresia] = await Promise.all([
          axios.get(`${API}/membresia/planes`, { withCredentials: true }),
          axios.get(`${API}/membresia/mi-membresia`, {
            withCredentials: true,
          }),
        ]);

        setPlanes(resPlanes.data.planes || []);
        setMembresia(
          resMembresia.data.activa ? resMembresia.data.membresia : null
        );
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los planes. Intentá de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  return (
    <div className="min-h-screen bg-[oklch(14.8%_0.004_228.8)] overflow-hidden relative">
      {/* Glow background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#4ade80]/15 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4ade80]/10 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle className="w-8 h-8 text-[#4ade80] animate-spin" />
          </div>
        ) : error ? (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400 text-sm text-center">
            {error}
          </div>
        ) : esAdmin ? (
            <PlanesAdmin planes={planes} setPlanes={setPlanes} />
          ) : (
            <PlanesCliente
              planes={planes.filter((p) => p.activo)}
              membresia={membresia}
              vinoRedirigido={vinoRedirigido}
            />
          )}
      </div>
    </div>
  );
}