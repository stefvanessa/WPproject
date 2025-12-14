import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "../api/client";

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load user on app start
  useEffect(() => {
    apiFetch<{ user?: any; message?: string }>("/auth/success")
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {
        // not logged in is fine; just proceed
      })
      .finally(() => {
        setLoading(false);
        setInitialized(true);
      });
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { expectJson: false, method: "GET" });
    } catch (err) {
      // ignore logout errors
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading: loading || !initialized, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext)!;
}
