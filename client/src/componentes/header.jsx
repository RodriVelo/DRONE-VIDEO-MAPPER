import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Home,
  User,
  Users,
  LogIn,
  UserPlus,
  LogOut,
  Zap,
  Menu,
  X,
  Route, 
  SlidersVertical,

} from "lucide-react";
import { useAuth } from "../utils/authContext";

const API = import.meta.env.VITE_API_URL;

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      logout();
      navigate("/login");
      setMenuOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  // Cierra el menú al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cierra el menú al navegar
  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

 
  return (
    <header className="bg-[#0f1117] text-white border-b border-white/[0.06] px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between relative">
      
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => go("/")}
      >
        <div className="w-[26px] h-[26px] bg-[#4ade80] rounded-md flex items-center justify-center">
          <Zap size={14} color="white" fill="white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Drone Video Mapper</span>
      </div>

      {/* Nav desktop — solo visible en sm+ */}
      <nav className="hidden sm:flex items-center gap-1">
        <NavButton onClick={() => go("/")}>
          <Home size={14} /> Home
        </NavButton>
        <NavButton onClick={() => go("/aplicacion")}>
          <Route  size={14} /> VideoMap
        </NavButton>
        <NavButton onClick={() => go("/calibrador")}>
          <SlidersVertical size={14} /> FOVCalibrador
        </NavButton>
        {user && (
          <NavButton onClick={() => go("/perfil")}>
            <User size={14} /> Perfil
          </NavButton>
        )}
        {/* {user?.rol === "cliente" && (
          <NavButton onClick={() => go("/misreservas")}>
            <List  size={14} /> Reservas
          </NavButton>
        )} */}
        {user?.rol === "admin" && (
          <>
            <NavButton onClick={() => go("/users")}>
              <Users size={14} /> Usuarios
            </NavButton>
          </>
        )}
      </nav>

      {/* Auth desktop — solo visible en sm+ */}
      <div className="hidden sm:flex items-center gap-2">
        {!user ? (
          <>
            <button
              onClick={() => go("/login")}
              className="flex items-center gap-1.5 text-[13px] text-white/75 border border-white/20 px-4 py-1.5 rounded-lg hover:bg-white/10 hover:border-white/35 transition-all"
            >
              <LogIn size={14} /> Login
            </button>
            <button
              onClick={() => go("/signup")}
              className="flex items-center gap-1.5 text-[13px] font-medium bg-[#4ade80] hover:bg-[#15803d] px-4 py-1.5 rounded-lg transition-colors"
            >
              <UserPlus size={14} /> Registrarse
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-[30px] h-[30px] rounded-full bg-[#4ade80]/20 border border-[#4ade80]/40 flex items-center justify-center">
                <User size={15} className="text-[#4ade80]" />
              </div>
              <span className="text-[13px] text-white/70">
                Hola, <span className="text-white font-medium">{user.nombre}</span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[13px] text-white/60 border border-white/15 px-3 py-1.5 rounded-lg hover:text-white hover:border-white/30 transition-all"
            >
              <LogOut size={14} /> Salir
            </button>
          </>
        )}
      </div>

      {/* Botón hamburguesa — solo en mobile */}
      <div className="sm:hidden" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Menú"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Dropdown mobile */}
        {menuOpen && (
          <div className="absolute top-full right-0 left-0 bg-[#111] border-b border-white/10 z-50 flex flex-col py-2 shadow-xl">
            
            {/* Usuario logueado: saludo */}
            {user && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-[28px] h-[28px] rounded-full bg-[#4ade80]/20 border border-[#4ade80]/40 flex items-center justify-center shrink-0">
                  <User size={13} className="text-[#4ade80]" />
                </div>
                <span className="text-[13px] text-white/70">
                  Hola, <span className="text-white font-medium">{user.nombre}</span>
                </span>
              </div>
            )}

            {/* Links de navegación */}
            <DropdownItem icon={<Home size={16} />} onClick={() => go("/")}>
              Home
            </DropdownItem>

  
            {user && (
              <DropdownItem icon={<User size={16} />} onClick={() => go("/perfil")}>
                Perfil
              </DropdownItem>
            )}
            {user?.rol === "admin" && (
              <>
                <DropdownItem icon={<Users size={16} />} onClick={() => go("/users")}>
                  Usuarios
                </DropdownItem>
              </>
            )}
            {/* {user && (
              <DropdownItem icon={<List size={16} />} onClick={() => go("/misreservas")}>
                Reservas
              </DropdownItem>
            )} */}
            {/* Auth */}
            <div className="border-t border-white/[0.06] mt-1 pt-1">
              {!user ? (
                <>
                  <DropdownItem icon={<LogIn size={16} />} onClick={() => go("/login")}>
                    Login
                  </DropdownItem>
                  <DropdownItem icon={<UserPlus size={16} />} onClick={() => go("/signup")} accent>
                    Registrarse
                  </DropdownItem>
                </>
              ) : (
                <DropdownItem icon={<LogOut size={16} />} onClick={handleLogout} danger>
                  Salir
                </DropdownItem>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NavButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-md transition-all"
    >
      {children}
    </button>
  );
}

function DropdownItem({ icon, children, onClick, accent, danger }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left transition-colors
        ${danger ? "text-red-400 hover:bg-red-500/10" : ""}
        ${accent ? "text-red-400 hover:bg-red-500/10" : ""}
        ${!danger && !accent ? "text-white/70 hover:text-white hover:bg-white/[0.06]" : ""}
      `}
    >
      {icon}
      {children}
    </button>
  );
}