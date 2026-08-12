import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer
      className="
        bg-[#0a0a0a]
        text-white
        border-t border-white/[0.06]

        px-4 sm:px-6 md:px-8
        py-5
      "
    >
      {/* Fila principal */}
      <div
        className="
          flex flex-col md:flex-row
          items-center
          justify-between

          gap-5

          pb-5
          border-b border-white/[0.07]
        "
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-[26px] h-[26px] bg-[#4ade80] rounded-md flex items-center justify-center">
            <Zap size={14} color="white" fill="white" />
          </div>

          <span className="text-[15px] font-semibold tracking-tight">
            Drone Video Mapper
          </span>
        </div>

        {/* Links */}
        <nav
          className="
            flex flex-wrap items-center justify-center
            gap-1
          "
        >
          {[
            { label: "Inicio", path: "/" },
            { label: "Contacto", path: "/contacto" },
            { label: "Acerca de", path: "/about" },
          ].map(({ label, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="
                text-[12px] sm:text-[13px]
                text-white/50
                hover:text-white
                hover:bg-white/10

                px-3 py-1.5
                rounded-md
                transition-all
              "
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Fila inferior */}
      <div
        className="
          flex flex-col md:flex-row
          items-center
          justify-between

          gap-4

          pt-4
        "
      >
        <p
          className="
            text-[11px] sm:text-[12px]
            text-white/30
            text-center md:text-left
          "
        >
          © {new Date().getFullYear()} MiApp. Todos los derechos reservados.
        </p>

        {/* Redes */}
        <div className="flex items-center gap-2">
          {[
            {
              label: "X / Twitter",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              ),
            },
            {
              label: "LinkedIn",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              ),
            },
            {
              label: "GitHub",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              ),
            },
          ].map(({ label, icon }) => (
            <button
              key={label}
              aria-label={label}
              className="
                w-[30px] h-[30px]
                sm:w-[32px] sm:h-[32px]

                rounded-[7px]

                border border-white/[0.12]
                text-white/40

                hover:text-white
                hover:bg-white/10
                hover:border-white/25

                flex items-center justify-center
                transition-all
              "
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}