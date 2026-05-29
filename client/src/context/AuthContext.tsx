import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "../api/client";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    apiFetch<{ user?: AuthUser; message?: string }>("/auth/success")
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

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { expectJson: false, method: "GET" });
    } catch {
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)!;
}
