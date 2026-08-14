import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#0f1016] px-6 py-20">
      {/* Glow background */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[380px] w-[620px] -translate-x-1/2 rounded-full bg-[#4ade80]/[0.06] blur-[110px]" />

      <div className="relative z-10 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4ade80]/[0.08] ring-1 ring-[#4ade80]/15">
          <Compass className="h-7 w-7 text-[#4ade80]" strokeWidth={1.75} />
        </span>

        <p className="mt-6 font-mono text-sm tracking-wide text-[#4ade80]/80">
          404
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Esta página no existe.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/45">
          La ruta que buscás no está disponible o fue movida. Revisá la
          dirección o volvé al inicio.
        </p>

        <Link
          to="/"
          className="group mt-8 inline-flex items-center gap-1.5 rounded-lg bg-[#4ade80] px-5 py-2.5 text-sm font-semibold text-[#0f1016] transition-colors hover:bg-[#3fce72]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}