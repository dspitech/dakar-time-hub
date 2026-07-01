import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, AuthUser, clearToken, getUser, setToken, setUser as saveUser } from "@/lib/api";

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<AuthUser>;
  register: (u: string, p: string) => Promise<AuthUser>;
  guest: () => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setUserState(getUser()); setLoading(false); }, []);

  const handleAuth = async (fn: () => Promise<{ token: string; role: any; username: string }>) => {
    const r = await fn();
    setToken(r.token);
    const u: AuthUser = { username: r.username, role: r.role };
    saveUser(u);
    setUserState(u);
    return u;
  };

  return (
    <Ctx.Provider value={{
      user, loading,
      login: (u, p) => handleAuth(() => api.login(u, p)),
      register: (u, p) => handleAuth(() => api.register(u, p)),
      guest: () => handleAuth(() => api.guest()),
      logout: async () => { await api.logout(); clearToken(); setUserState(null); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
