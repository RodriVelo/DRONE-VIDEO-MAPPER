import { useState } from "react";
import axios from "axios";
import {
  LoaderCircle,
  ShieldCheck,
  Pencil,
  Trash2,
  Save,
  X,
  Power,
  Plus,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

// Molde vacío que usa el formulario mientras no hay ningún plan en edición.
const PLAN_VACIO = {
  id: null,
  nombre: "",
  descripcion: "",
  precio: "",
  duracion_dias: "",
  activo: true,
};

function FormularioPlan({ borrador, onCambiarCampo, onCancelar, onGuardar, guardando, textoBoton }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Nombre</label>
          <input
            type="text"
            value={borrador.nombre}
            onChange={(e) => onCambiarCampo("nombre", e.target.value)}
            placeholder="ej: mensual"
            className="w-full rounded-lg bg-white/[0.05] border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4ade80]/50"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Precio (ARS)
          </label>
          <input
            type="number"
            value={borrador.precio}
            onChange={(e) => onCambiarCampo("precio", e.target.value)}
            placeholder="0"
            className="w-full rounded-lg bg-white/[0.05] border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4ade80]/50"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Duración (días)
          </label>
          <input
            type="number"
            value={borrador.duracion_dias}
            onChange={(e) => onCambiarCampo("duracion_dias", e.target.value)}
            placeholder="30"
            className="w-full rounded-lg bg-white/[0.05] border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4ade80]/50"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-300 pb-2">
          <input
              type="checkbox"
              checked={!!borrador.activo}
              onChange={(e) => onCambiarCampo("activo", e.target.checked)}
              className="accent-[#4ade80] w-4 h-4"
            />
            Plan activo (visible para usuarios)
          </label>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">
          Descripción
        </label>
        <textarea
          value={borrador.descripcion}
          onChange={(e) => onCambiarCampo("descripcion", e.target.value)}
          rows={2}
          placeholder="Qué incluye este plan"
          className="w-full rounded-lg bg-white/[0.05] border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4ade80]/50 resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancelar}
          disabled={guardando}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <X size={15} />
          Cancelar
        </button>
        <button
          onClick={onGuardar}
          disabled={guardando}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#4ade80] hover:brightness-110 text-white disabled:opacity-60 transition-all"
        >
          {guardando ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {textoBoton}
        </button>
      </div>
    </div>
  );
}

export default function PlanesAdmin({ planes, setPlanes }) {
  const [editandoId, setEditandoId] = useState(null); // id del plan en edición, o null
  const [borradorPlan, setBorradorPlan] = useState(PLAN_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [creandoNuevo, setCreandoNuevo] = useState(false);

  const formatearPrecio = (precio) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(precio);

  const empezarEdicion = (plan) => {
    setEditandoId(plan.id);
    setBorradorPlan({ ...plan });
  };

    const empezarCreacion = () => {
      setEditandoId(null);
      setBorradorPlan(PLAN_VACIO);
      setCreandoNuevo(true);
    };

  const actualizarCampoBorrador = (campo, valor) => {
    setBorradorPlan((prev) => ({ ...prev, [campo]: valor }));
  };

  // ============================================================
  // Peticiones al backend. Los endpoints /membresia/admin/planes...
  // todavía no existen — los completás vos (dejo el llamado listo,
  // comentado, con el método/body esperado).
  // ============================================================

const guardarPlan = async () => {
  try {
    setGuardando(true);
    setError(null);

    if (creandoNuevo) {
      const { data } = await axios.post(
        `${API}/membresia/admin/crear-plan`,
        borradorPlan,
        { withCredentials: true }
      );
      setPlanes((prev) => [...prev, data.plan]);
    } else {
      const { data } = await axios.put(
        `${API}/membresia/admin/editar-plan/${editandoId}`,
        borradorPlan,
        { withCredentials: true }
      );
      setPlanes((prev) =>
        prev.map((p) => (p.id === editandoId ? data.plan : p))
      );
    }

    cancelarEdicion();
  } catch (err) {
    console.error(err);
    setError("No se pudo guardar el plan.");
  } finally {
    setGuardando(false);
  }
};

 const eliminarPlan = async (idPlan) => {
  try {
    setError(null);
    await axios.delete(
      `${API}/membresia/admin/eliminar-membresia/${idPlan}`,
      { withCredentials: true }
    );

    setPlanes((prev) => prev.filter((p) => p.id !== idPlan)); // sin esto, el plan eliminado sigue mostrándose en pantalla
  } catch (error) {
    console.log(error);
    setError("No se pudo eliminar el plan.");
  }
};



const cancelarEdicion = () => {
  setEditandoId(null);
  setCreandoNuevo(false);
  setBorradorPlan(PLAN_VACIO);
};


  const toggleActivo = async (plan) => {
    // TODO: PATCH ${API}/membresia/admin/planes/${plan.id}  body: { activo: !plan.activo }
    // const { data } = await axios.patch(`${API}/membresia/admin/planes/${plan.id}`, { activo: !plan.activo }, { withCredentials: true });
    // setPlanes((prev) => prev.map((p) => (p.id === plan.id ? data.plan : p)));
  };

  return (
    <>
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-medium">
          <ShieldCheck size={14} />
          Modo administrador
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Gestionar planes de membresía
        </h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          Creá, editá o desactivá los planes que ven los usuarios.
        </p>
      </div>

      {error && (
        <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-4">
        {planes.map((plan) => {
          const enEdicion = editandoId === plan.id;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border px-6 py-5 ${
                plan.activo === false
                  ? "border-slate-800 bg-[oklch(19%_0.006_285.885)] opacity-60"
                  : "border-slate-800 bg-[oklch(21%_0.006_285.885)]"
              }`}
            >
              {enEdicion ? (
                <FormularioPlan
                  borrador={borradorPlan}
                  onCambiarCampo={actualizarCampoBorrador}
                  onCancelar={cancelarEdicion}
                  onGuardar={guardarPlan}
                  guardando={guardando}
                  textoBoton="Guardar"
                />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white capitalize">
                        Plan {plan.nombre}
                      </h3>
                      {plan.activo === false && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-[10px] font-semibold uppercase tracking-wide">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-slate-500 text-sm">
                      {plan.descripcion}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-white font-semibold">
                        {formatearPrecio(plan.precio)}
                      </span>
                      <span className="text-slate-500">
                        {plan.duracion_dias} días
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => empezarEdicion(plan)}
                      title="Editar plan"
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => eliminarPlan(plan.id)}
                      title="Eliminar plan"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

     {creandoNuevo && (
        <div className="max-w-3xl mx-auto mb-4 my-10">
          <div className="rounded-2xl border border-slate-800 bg-[oklch(21%_0.006_285.885)] px-6 py-5">
            <FormularioPlan
              borrador={borradorPlan}
              onCambiarCampo={actualizarCampoBorrador}
              onCancelar={cancelarEdicion}
              onGuardar={guardarPlan}
              guardando={guardando}
              textoBoton="Crear plan"
            />
          </div>
        </div>
      )}

<div className="max-w-3xl mx-auto mt-10">
  <button
    onClick={empezarCreacion}
    disabled={creandoNuevo}
    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-slate-700 text-slate-400 hover:text-[#4ade80] hover:border-[#4ade80]/40 hover:bg-[#4ade80]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm"
  >
    <Plus size={16} />
    Agregar membresía
  </button>
</div>
    </>
  );
}