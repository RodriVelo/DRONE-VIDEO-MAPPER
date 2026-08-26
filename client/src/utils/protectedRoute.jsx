import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { LoaderCircle } from "lucide-react";

// Cada cuánto se vuelve a chequear la membresía mientras el usuario ya
// está adentro de una página protegida (ms). Ajustable.
const INTERVALO_CHEQUEO_MEMBRESIA_MS = 60_000;

const ProtectedRoute = ({ children, rolPermitido, requireActive = false }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false); // logueado pero sin permiso suficiente
  const [denyReason, setDenyReason] = useState(null); // "rol" | "membresia"
  const [user, setUser] = useState(null);

  const location = useLocation();

  const checkAuth = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      setDenyReason(null);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        { withCredentials: true },
      );

      const userData = response.data.user;

      // Verificar roles si se especifican (el admin siempre pasa)
      if (rolPermitido) {
        const rolesPermitidos = Array.isArray(rolPermitido)
          ? rolPermitido
          : [rolPermitido];

        const tienePermiso =
          userData.rol === "admin" || rolesPermitidos.includes(userData.rol);

        if (!tienePermiso) {
          setIsAuthenticated(true); // está logueado...
          setAccessDenied(true);    // ...pero no puede ver esta ruta
          setDenyReason("rol");
          setUser(userData);
          return;
        }
      }

      // Verificar membresía paga activa si la ruta lo exige (admin siempre pasa)
      if (requireActive && userData.rol !== "admin") {
        const membresiaResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/membresia/mi-membresia`,
          { withCredentials: true },
        );

        if (!membresiaResponse.data.activa) {
          setIsAuthenticated(true);
          setAccessDenied(true);
          setDenyReason("membresia");
          setUser(userData);
          return;
        }
      }

      setUser(userData);
      setIsAuthenticated(true);
      setAccessDenied(false);
    } catch (error) {
      console.log("No autenticado", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Chequeo "silencioso" (sin tocar `loading`, para no tapar la app con el
  // spinner mientras el usuario ya está trabajando adentro). Se usa en el
  // polling periódico: si la membresía dejó de estar activa a mitad de
  // sesión (se venció, se la cancelaron, se borró el pago, etc.), lo
  // detecta y saca al usuario sin que tenga que recargar la página.
  const revalidarMembresiaEnSilencio = async () => {
    if (!requireActive) return;

    try {
      const meResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        { withCredentials: true },
      );

      const userData = meResponse.data.user;

      // El admin siempre pasa, no hace falta chequear membresía.
      if (userData.rol === "admin") return;

      const membresiaResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/membresia/mi-membresia`,
        { withCredentials: true },
      );

      if (!membresiaResponse.data.activa) {
        setAccessDenied(true);
        setDenyReason("membresia");
      }
    } catch (error) {
      // Si falla la sesión (401, etc.) directamente lo mandamos a login.
      console.log("Chequeo de membresía falló:", error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  // Polling en segundo plano mientras el usuario está adentro de una
  // página que exige membresía activa.
  useEffect(() => {
    if (!requireActive || loading || accessDenied || !isAuthenticated) {
      return;
    }

    const interval = setInterval(
      revalidarMembresiaEnSilencio,
      INTERVALO_CHEQUEO_MEMBRESIA_MS,
    );

    return () => clearInterval(interval);
  }, [requireActive, loading, accessDenied, isAuthenticated, location.pathname]);


  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[oklch(14.8%_0.004_228.8)] flex items-center justify-center overflow-hidden relative">
        {/* Glow background */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#4ade80]/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#4ade80]/10 blur-3xl rounded-full" />

        <div className="relative z-10 flex flex-col items-center gap-6 rounded-3xl border border-slate-800 bg-[oklch(21%_0.006_285.885)] px-10 py-8">
          <div className="w-16 h-16 rounded-2xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
            <LoaderCircle className="w-8 h-8 text-[#4ade80] animate-spin" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">
              Verificando sesión
            </h2>

            <p className="mt-2 text-slate-400 text-sm">
              Cargando información del sistema...
            </p>
          </div>

          <div className="w-56 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-1/2 bg-[#4ade80] animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }


  // Sin sesión → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Con sesión pero sin permiso/membresía suficiente
  if (accessDenied) {
    const destino = denyReason === "membresia" ? "/planes" : "/perfil";
    return <Navigate to={destino} replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;