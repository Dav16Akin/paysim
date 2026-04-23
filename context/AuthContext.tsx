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
import { signIn as apiSignIn, signUp as apiSignUp, getMe, setAccessToken, clearAccessToken } from "@/lib/api";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

// ────────────────────────────────────────────
// Context
// ────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ────────────────────────────────────────────
// Storage helpers
// ────────────────────────────────────────────

const ACCESS_TOKEN_KEY = "paysim_access_token";
const USER_KEY = "paysim_user";

function persistToken(accessToken: string) {
  setAccessToken(accessToken);
}

function persistUser(user: { id: string; name: string; email: string; avatar_url?: string }) {
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url })
  );
}

function clearAuth() {
  clearAccessToken();
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
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
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
    // 1. Sign in — get access token (refresh token arrives as HttpOnly cookie)
    const { accessToken } = await apiSignIn(email, password);
    persistToken(accessToken);
    setToken(accessToken);
    // 2. Fetch user profile now that the token is stored
    const { user: me } = await getMe();
    persistUser(me);
    setUser({ id: me.id, name: me.name, email: me.email, avatar_url: me.avatar_url });
    router.push("/dashboard");
  }, [router]);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      // sign-up only creates the user (no token returned)
      await apiSignUp(name, email, password);
      // auto sign-in to obtain the tokens
      const { accessToken } = await apiSignIn(email, password);
      persistToken(accessToken);
      setToken(accessToken);
      // fetch user profile
      const { user: me } = await getMe();
      persistUser(me);
      setUser({ id: me.id, name: me.name, email: me.email, avatar_url: me.avatar_url });
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

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      persistUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
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
