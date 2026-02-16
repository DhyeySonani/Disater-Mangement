import { createContext, useState, useContext } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

function getInitialUser() {
  const token = sessionStorage.getItem("token");
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    sessionStorage.removeItem("token");
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);

  const login = (token, userData) => {
    sessionStorage.setItem("token", token);
    const decoded = jwtDecode(token);
    setUser(userData ? { ...decoded, ...userData } : decoded);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
