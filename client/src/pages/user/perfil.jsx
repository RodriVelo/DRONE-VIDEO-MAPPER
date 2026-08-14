import { User, FileText, Mail, Phone, BadgeCheck, Pencil } from "lucide-react";
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
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#4ade80]/15 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4ade80]/10 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

          {/* Panel izquierdo: avatar / identidad */}
          <div className="rounded-3xl border border-slate-800 bg-[oklch(21%_0.006_285.885)] px-8 py-10 flex flex-col items-center text-center lg:sticky lg:top-16 lg:self-start">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-[#4ade80] flex items-center justify-center text-white text-3xl font-black tracking-tight shadow-lg shadow-[#4ade80]/30">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#4ade80] rounded-full border-2 border-[oklch(21%_0.006_285.885)] flex items-center justify-center">
                <BadgeCheck size={14} className="text-white" strokeWidth={3} />
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-black tracking-tight text-white">
              {user.nombre} {user.apellido}
            </h1>
            <p className="mt-1 text-slate-500 text-sm">Perfil de usuario</p>

            <span className="inline-flex items-center gap-1.5 mt-4 text-[#4ade80] text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              Activo
            </span>

            <div className="w-full h-px bg-slate-800 my-6" />

            <p className="text-slate-700 text-xs tracking-widest uppercase">
              NRO.DOC · {user.nro_documento}
            </p>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#4ade80] hover:brightness-110 transition-all duration-200 font-semibold text-white shadow-lg shadow-[#4ade80]/20 active:scale-95"
            >
              <Pencil size={15} />
              Editar perfil
            </button>
          </div>

          {/* Panel derecho: datos en grilla */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            {fields.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800 bg-[oklch(21%_0.006_285.885)] px-6 py-5 flex items-center gap-4 group hover:bg-white/[0.03] hover:border-slate-700 transition-colors duration-150"
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
                  <Icon size={16} className="text-[#4ade80]" />
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

        </div>
      </div>
    </div>
  );
}