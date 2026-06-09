import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "RECEPCIONISTA" | "TECNICO";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: "fake-admin-id",
    nombre: "Admin Preview",
    email: "admin@taller.com",
    rol: "ADMIN",
  });
  const [token, setToken] = useState<string | null>("fake-token");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Disabled authentication for preview
  }, []);

  const login = (newToken: string, newUser: User) => {
    //
  };

  const logout = () => {
    //
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
