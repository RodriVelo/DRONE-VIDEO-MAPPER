import { User, FileText, Mail, Phone, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PerfilEdit from "../../componentes/perfil/perfilEdit";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Perfil() {
  const [user, setUser] = useState({
    id: "",
    nombre: "",
    apellido: "",
    nro_documento: "",
    email: "",
    telefono: "",
  });
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sinTelefono, setSinTelefono] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await axios.get(`${API}/user/getUser`, {
          withCredentials: true,
        });
        if (response.data.success) {
          setUser(response.data.user);
          if (!response.data.user.telefono) {
            setSinTelefono(true);
            setIsEditing(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    getUser();
  }, []);

  const initials = `${user.nombre?.[0] || ""}${user.apellido?.[0] || ""}`;

  const fields = [
    { label: "Nombre", value: user.nombre, icon: User },
    { label: "Apellido", value: user.apellido, icon: User },
    { label: "Nro. Documento", value: user.nro_documento, icon: FileText },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Teléfono", value: user.telefono, icon: Phone },
  ];

  async function handleSaveProfile(updatedData) {
    try {
      const response = await axios.put(`${API}/user/updateUser`, updatedData, {
        withCredentials: true,
      });
      if (response.data.success) {
        setUser(response.data.user);
        setIsEditing(false);
        navigate("/perfil");
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (isEditing) {
    return (
      <section>
        <PerfilEdit
          userData={user}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
          loading={loading}
          avisoTelefono={sinTelefono}
        />
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(14.8%_0.004_228.8)] overflow-hidden relative">
      {/* Glow background */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#4ade80]/20 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#4ade80]/10 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-lg mx-auto px-6 py-16">

        {/* Avatar + nombre */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-2xl bg-[#4ade80] flex items-center justify-center text-white text-2xl font-black tracking-tight shadow-lg shadow-[#4ade80]/30 mx-auto">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#4ade80] rounded-full border-2 border-[oklch(14.8%_0.004_228.8)] flex items-center justify-center">
              <BadgeCheck size={13} className="text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-black tracking-tight text-white">
            {user.nombre} {user.apellido}
          </h1>
          <p className="mt-1 text-slate-500 text-sm">Perfil de usuario</p>

          <span className="inline-flex items-center gap-1.5 mt-3 text-[#4ade80] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            Activo
          </span>
        </div>

        {/* Fields */}
        <div className="rounded-3xl border border-slate-800 bg-[oklch(21%_0.006_285.885)] overflow-hidden divide-y divide-slate-800 mb-4">
          {fields.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-4 px-6 py-4 group hover:bg-white/[0.03] transition-colors duration-150"
            >
              <div className="shrink-0 w-9 h-9 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
                <Icon size={15} className="text-[#4ade80]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">
                  {label}
                </p>
                <p className="text-white text-sm font-semibold truncate">
                  {value || <span className="text-slate-600 font-normal">—</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ID */}
        <p className="text-center text-slate-700 text-xs tracking-widest uppercase mb-4">
          ID · {user.nro_documento}
        </p>

        {/* Botón */}
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#4ade80] hover:bg-[#4ade80] transition-all duration-200 font-semibold text-white shadow-lg shadow-[#4ade80]/20 active:scale-95"
        >
          Editar perfil
        </button>
      </div>
    </div>
  );
}