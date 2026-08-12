import "./App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify"; // 👈
import "react-toastify/dist/ReactToastify.css"; // 👈

import Home from "./pages/home/home";
import Header from "./componentes/header";
import Footer from "./componentes/footer";

import Signup from "./pages/auth/signup";
import Login from "./pages/auth/login";

import ProtectedRoute from "./utils/protectedRoute";

import Perfil from "./pages/user/perfil";
import PanelAdminUsers from "./pages/admin/panelAdminUsers";
import Aplicacion from "./pages/aplicacion/Aplicacion";


import { AuthProvider } from "./utils/authContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          toastStyle={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e2e8f0",
            borderRadius: "12px",
          }}
        />
        <Header />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/signup" element={<Signup />} />

          <Route path="/login" element={<Login />} />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
         
          <Route
            path="/users"
            element={
              <ProtectedRoute rolPermitido="admin">
                <PanelAdminUsers />
              </ProtectedRoute>
            }
          />
          <Route path="/aplicacion" element={
            <ProtectedRoute >
              <Aplicacion />
            </ProtectedRoute> } />
        </Routes>

        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
