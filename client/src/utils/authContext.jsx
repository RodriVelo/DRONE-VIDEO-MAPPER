import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Verificar sesión
  const checkAuth = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
      });

      setUser(response.data.user);
      setIsAuthenticated(true); // ← faltaba: la sesión es válida
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false); // ← y acá, por las dudas quede un estado viejo
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth, // ← útil exponerlo si en algún lado necesitás re-chequear manualmente
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);