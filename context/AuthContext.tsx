"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signIn as apiSignIn, signUp as apiSignUp } from "@/lib/api";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ────────────────────────────────────────────
// Context
// ────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ────────────────────────────────────────────
// Storage helpers
// ────────────────────────────────────────────

const TOKEN_KEY = "paysim_token";
const USER_KEY = "paysim_user";

function persistAuth(resp: { token: string; user: { id: string; name: string; email: string } }) {
  localStorage.setItem(TOKEN_KEY, resp.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: resp.user.id, name: resp.user.name, email: resp.user.email })
  );
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await apiSignIn(email, password);
    persistAuth(resp);
    setToken(resp.token);
    setUser({ id: resp.user.id, name: resp.user.name, email: resp.user.email });
    router.push("/dashboard");
  }, [router]);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      // sign-up only creates the user (no token returned)
      await apiSignUp(name, email, password);
      // auto sign-in to obtain the token
      const resp = await apiSignIn(email, password);
      persistAuth(resp);
      setToken(resp.token);
      setUser({ id: resp.user.id, name: resp.user.name, email: resp.user.email });
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setToken(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
