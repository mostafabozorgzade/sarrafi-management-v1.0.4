"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  mobile: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "CASHIER" | "ACCOUNTANT";
  tenantId: string | null;
  tenantName: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (mobile: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const forceLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  }, []);

  const refreshUser = useCallback(async () => {
    if (pathname === "/login") {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsLoading(false);
      } else {
        await forceLogout();
      }
    } catch {
      await forceLogout();
    }
  }, [pathname, forceLogout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (mobile: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "خطا در ورود" };
      }

      setUser(data.user);
      router.push("/dashboard");
      return { success: true };
    } catch {
      return { success: false, error: "خطا در اتصال به سرور" };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
