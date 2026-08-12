import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

// ── Spinner ──────────────────────────────────────────────
function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
  );
}

// ── Badge rol ────────────────────────────────────────────
function BadgeRol({ rol }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
        rol === "admin"
          ? "bg-red-500/10 border-red-500/20 text-red-400"
          : "bg-zinc-800 border-zinc-700 text-zinc-400"
      }`}
    >
      {rol}
    </span>
  );
}

// ── Avatar iniciales ─────────────────────────────────────
function Avatar({ nombre, apellido }) {
  const initials = `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs font-bold text-red-400 shrink-0">
      {initials}
    </div>
  );
}

// ── Modal detalle usuario ────────────────────────────────
function ModalUsuario({ usuario, onClose }) {
  if (!usuario) return null;
  const campos = [
    { label: "Nombre completo", value: `${usuario.nombre} ${usuario.apellido}` },
    { label: "Email", value: usuario.email ?? "—" },
    { label: "Teléfono", value: usuario.telefono ?? "—" },
    { label: "N° documento", value: usuario.nro_documento ?? "—" },
    { label: "Rol", value: <BadgeRol rol={usuario.rol ?? "cliente"} /> },
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
          <h2 className="text-base font-bold text-white">Detalle de usuario</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-base font-bold text-red-400">
            {`${usuario.nombre?.[0] ?? ""}${usuario.apellido?.[0] ?? ""}`.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{usuario.nombre} {usuario.apellido}</p>
            <p className="text-xs text-zinc-500">{usuario.email}</p>
          </div>
        </div>

        <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl divide-y divide-zinc-700 text-sm">
          {campos.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-4 py-3 gap-4">
              <span className="text-zinc-400 shrink-0">{label}</span>
              <span className="text-white font-semibold text-right">{value}</span>
            </div>
          ))}
        </div>

        {usuario.telefono && (
          <a
            href={`https://wa.me/${usuario.telefono}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 font-bold rounded-xl text-sm text-center transition-all duration-150"
          >
            Contactar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

// ── Principal ────────────────────────────────────────────
export default function NavegadorModalUsuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => {
    const getUsuarios = async () => {
      try {
        const res = await axios.get(`${API}/panelAdmin/getUsers`);
        if (res.data.success) 

         setUsuarios(res.data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getUsuarios();
  }, []);

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.apellido?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.nro_documento?.toString().includes(q) ||
      u.rol?.toString().includes(q)
    );
  });

  return (
    <>
      {usuarioSeleccionado && (
        <ModalUsuario usuario={usuarioSeleccionado} onClose={() => setUsuarioSeleccionado(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-zinc-800 flex-wrap">
        <h2 className="text-sm font-bold text-white">Usuarios registrados</h2>
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 w-full sm:w-auto">
          <Search size={13} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none w-56"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="text-zinc-600 hover:text-zinc-400">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-zinc-500">
          <p className="text-sm">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Usuario", "Email", "Teléfono", "DNI", "Rol", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar nombre={u.nombre} apellido={u.apellido} />
                      <span className="font-medium text-zinc-100">{u.nombre} {u.apellido}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{u.email ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-400">{u.telefono ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-400">{u.nro_documento ?? "—"}</td>
                  <td className="px-5 py-3"><BadgeRol rol={u.rol ?? "cliente"} /></td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setUsuarioSeleccionado(u)}
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