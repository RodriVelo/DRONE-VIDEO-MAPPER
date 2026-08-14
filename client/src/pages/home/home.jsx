import { motion } from "framer-motion";
import {
  ArrowRight,
  Video,
  FileUp,
  MapPinned,
  Compass,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ---------------------------------------------------------
   Navbar
--------------------------------------------------------- */


/* ---------------------------------------------------------
   Flight analysis visual (mockup abstracto)
--------------------------------------------------------- */
function FlightAnalysisVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-3xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#191b25] shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
        {/* window bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
          </div>
          <span className="font-mono text-[11px] tracking-wide text-white/30">
            flight_analysis.map
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#4ade80]/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_1px_rgba(74,222,128,0.6)]" />
            live
          </span>
        </div>

        <div className="grid grid-cols-1 gap-px bg-white/[0.06] sm:grid-cols-[1.6fr_1fr]">
          {/* Map / trajectory panel */}
          <div className="relative bg-[#191b25] p-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/[0.06] bg-[#14151d]">
              {/* grid backdrop */}
              <svg
                className="absolute inset-0 h-full w-full opacity-[0.35]"
                viewBox="0 0 300 225"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#ffffff"
                      strokeOpacity="0.06"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="300" height="225" fill="url(#grid)" />
              </svg>

              {/* GPS trajectory path */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 300 225"
                fill="none"
              >
                <motion.path
                  d="M40 170 C 80 120, 100 150, 130 110 S 190 60, 230 55 S 260 40, 250 30"
                  stroke="#4ade80"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.9 }}
                  transition={{ duration: 1.8, delay: 0.5, ease: "easeInOut" }}
                />
                <circle cx="40" cy="170" r="3" fill="#4ade80" fillOpacity="0.9" />
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.9 }}
                >
                  <circle cx="250" cy="30" r="7" fill="#4ade80" fillOpacity="0.15" />
                  <circle cx="250" cy="30" r="3.5" fill="#4ade80" />
                </motion.g>
              </svg>

              {/* location marker */}
              <div className="absolute left-[11%] top-[71%] -translate-x-1/2 -translate-y-full">
                <MapPin className="h-4 w-4 text-[#4ade80]/70" strokeWidth={2} />
              </div>

              {/* compass indicator */}
              <div className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#0f1016]/80 backdrop-blur-sm">
                <motion.div
                  initial={{ rotate: -20 }}
                  animate={{ rotate: 18 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                >
                  <Compass className="h-5 w-5 text-white/60" strokeWidth={1.75} />
                </motion.div>
              </div>

              {/* coordinate label */}
              <div className="absolute left-3 top-3 rounded border border-white/10 bg-[#0f1016]/70 px-1.5 py-1 font-mono text-[10px] leading-none text-white/40">
                -38.9516, -68.0591
              </div>
            </div>
          </div>

          {/* Data / video panel */}
          <div className="flex flex-col gap-px bg-white/[0.06]">
            <div className="flex items-center gap-2.5 bg-[#191b25] p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] ring-1 ring-white/10">
                <Video className="h-3.5 w-3.5 text-white/50" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-white/80">
                  DJI_0231.MP4
                </p>
                <p className="font-mono text-[10px] text-white/35">
                  00:42 — 02:18
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-px bg-white/[0.06] text-left sm:grid-cols-1">
              {[
                ["GPS", "35.2 m"],
                ["Heading", "142°"],
                ["FOV", "84°"],
                ["Speed", "6.4 m/s"],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#191b25] px-4 py-2.5">
                  <dt className="font-mono text-[10px] uppercase tracking-wide text-white/35">
                    {label}
                  </dt>
                  <dd className="mt-0.5 font-mono text-[13px] text-[#4ade80]/90">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------
   Hero
--------------------------------------------------------- */
function Hero() {
  const navigate = useNavigate();
    const go = (path) => {
    navigate(path);
  
  };

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-20 sm:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#4ade80]/[0.06] blur-[110px]"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#4ade80]/20 bg-[#4ade80]/[0.06] px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-[#4ade80]"
        >
          DRONE VIDEO MAPPER
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-5 text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl"
        >
          Analizá tus vuelos de drone
          <br className="hidden sm:block" /> de forma inteligente.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/50"
        >
          Procesá tus videos y datos de telemetría para visualizar, analizar
          y mapear la información capturada durante tus vuelos.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          
            <button onClick={() => go("/aplicacion")} className="group inline-flex items-center gap-1.5 rounded-lg bg-[#4ade80] px-5 py-2.5 text-sm font-semibold text-[#0f1016] transition-colors hover:bg-[#3fce72]" >
               Comenzar 
               <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
           
        </motion.div>
      </div>

      <div className="relative mt-16">
        <FlightAnalysisVisual />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   How it works
--------------------------------------------------------- */
const steps = [
  {
    number: "01",
    icon: Video,
    title: "Cargá tu video",
    description: "Seleccioná el archivo de video grabado por tu drone.",
  },
  {
    number: "02",
    icon: FileUp,
    title: "Cargá la telemetría",
    description: "Importá el archivo SRT con los datos del vuelo.",
  },
  {
    number: "03",
    icon: MapPinned,
    title: "Analizá y mapeá",
    description:
      "Visualizá la información del vuelo y trabajá con los puntos de interés.",
  },
];

function HowItWorks() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-lg text-center"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            ¿Cómo funciona?
          </h2>
          <p className="mt-3 text-[15px] text-white/45">
            Tres pasos para pasar de imágenes crudas a datos utilizables.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="group rounded-xl border border-white/[0.07] bg-[#191b25] p-6 transition-colors hover:border-[#4ade80]/20"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4ade80]/[0.08] ring-1 ring-[#4ade80]/15">
                  <step.icon className="h-4 w-4 text-[#4ade80]" strokeWidth={1.75} />
                </span>
                <span className="font-mono text-xs text-white/25">
                  {step.number}
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/45">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ---------------------------------------------------------
   Home
--------------------------------------------------------- */
export default function Home() {
  
  return (
    <div className="min-h-screen bg-[#0f1016] font-sans antialiased selection:bg-[#4ade80]/20 selection:text-[#4ade80]">
      <main>
        <Hero />
        <HowItWorks />
      </main>
\
    </div>
  );
}