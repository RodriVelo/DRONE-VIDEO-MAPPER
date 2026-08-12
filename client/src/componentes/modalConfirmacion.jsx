export default function ModalConfirmacion({ mensaje, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
        <p className="text-zinc-200 text-sm text-center mb-6">{mensaje}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={onCancelar}
            className="px-4 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="px-4 py-1.5 rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 hover:bg-red-500/20 text-xs transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}