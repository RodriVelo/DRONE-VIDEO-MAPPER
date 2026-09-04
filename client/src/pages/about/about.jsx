import { motion } from "framer-motion";
import {
  Compass,
  Video,
  MapPinned,
  Radar,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ---------------------------------------------------------
   Hero
------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-20 sm:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-[#4ade80]/[0.06] blur-[110px]"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#4ade80]/20 bg-[#4ade80]/[0.06] px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-[#4ade80]"
        >
          ACERCA DE
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-5 text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl"
        >
          Un vuelo de drone genera
          <br className="hidden sm:block" /> mucha más información de la que
          se ve.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/50"
        >
          Frase para rellenar, ej: 
          Drone Video Mapper nació de un problema puntual de campo: cruzar
          video de vuelo con telemetría GPS para ubicar objetos con precisión,
          sin depender de software de procesamiento pesado ni de licencias
          costosas.
        </motion.p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   Por qué existe — dos columnas de contexto
--------------------------------------------------------- */
function Contexto() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-2">
        <div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4ade80]/[0.08] ring-1 ring-[#4ade80]/15">
            <Radar className="h-4 w-4 text-[#4ade80]" strokeWidth={1.75} />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-white">
            El problema de campo
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/45">
            Ej: Los archivos SRT que exportan los drones traen GPS, altura y
            rumbo cuadro a cuadro, pero casi nadie los cruza con el video en
            el momento de revisar el material. El resultado: horas de
            grabación y ninguna coordenada exacta de lo que se vio.
          </p>
        </div>

        <div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4ade80]/[0.08] ring-1 ring-[#4ade80]/15">
            <Compass className="h-4 w-4 text-[#4ade80]" strokeWidth={1.75} />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-white">
            Lo que resolvemos
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/45">
            Ej: VideoMap sincroniza el video con la telemetría, calcula la
            posición real de cualquier punto donde hagas clic y te deja
            exportarlo. El FOV Calibrador ajusta el campo visual real de tu
            cámara para que ese cálculo sea preciso, dron por dron.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   Recorrido del producto — acá sí es una secuencia real
--------------------------------------------------------- */
const hitos = [
  {
    numero: "01",
    icon: Compass,
    titulo: "FOV Calibrador",
    texto:
      "El primer módulo: medir el campo visual real de cada cámara de drone contra una marca conocida en el terreno.",
  },
  {
    numero: "02",
    icon: Video,
    titulo: "VideoMap",
    texto:
      "Con el FOV calibrado, se sumó la sincronización video + SRT para ubicar cualquier objeto con un clic sobre el frame.",
  },
  {
    numero: "03",
    icon: MapPinned,
    titulo: "Exportación y categorías",
    texto:
      "Se agregaron categorías configurables por proyecto y exportación a CSV / GeoJSON para llevar los datos a otras herramientas.",
  },
];

function Recorrido() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Cómo se armó la plataforma
          </h2>
          <p className="mt-3 text-[15px] text-white/45">
            Cada módulo se construyó para resolver el paso siguiente del
            mismo flujo de trabajo.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {hitos.map((h, i) => (
            <motion.div
              key={h.numero}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="group rounded-xl border border-white/[0.07] bg-[#191b25] p-6 transition-colors hover:border-[#4ade80]/20"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4ade80]/[0.08] ring-1 ring-[#4ade80]/15">
                  <h.icon className="h-4 w-4 text-[#4ade80]" strokeWidth={1.75} />
                </span>
                <span className="font-mono text-xs text-white/25">
                  {h.numero}
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-white">
                {h.titulo}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/45">
                {h.texto}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   Cierre / CTA
--------------------------------------------------------- */
function Cierre() {
  const navigate = useNavigate();

  return (
    <section className="border-t border-white/[0.06] px-6 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4ade80]/[0.08] ring-1 ring-[#4ade80]/15">
          <ShieldCheck className="h-4 w-4 text-[#4ade80]" strokeWidth={1.75} />
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Seguimos sumando lo que pide el terreno.
        </h2>
        <p className="max-w-md text-[14.5px] leading-relaxed text-white/45">
          Si trabajás con relevamientos por drone y te falta algo puntual en
          la plataforma, contanos qué necesitás.
        </p>
        <button
          onClick={() => navigate("/contacto")}
          className="group mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#4ade80] px-5 py-2.5 text-sm font-semibold text-[#0f1016] transition-colors hover:bg-[#3fce72]"
        >
          Escribinos
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   About
--------------------------------------------------------- */
export default function About() {
  return (
    <div className="min-h-screen bg-[#0f1016] font-sans antialiased selection:bg-[#4ade80]/20 selection:text-[#4ade80]">
      <main>
        <Hero />
        <Contexto />
        <Recorrido />
        <Cierre />
      </main>
    </div>
  );
} 