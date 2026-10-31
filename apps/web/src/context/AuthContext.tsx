import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UserRole } from "@alpha-cut/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified?: boolean;
  telegramId?: string;
  telegramUsername?: string;
  telegramLinkedAt?: string | Date;
  brandName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: AuthUser, token?: string) => void;
  loginWithGoogle: (credential: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  updateProfile: (data: { name?: string; telegramUsername?: string; brandName?: string }) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = "alpha_cut_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authenticated fetch wrapper that sends Authorization header & credentials
  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = new Headers(options.headers || {});

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (userData: AuthUser, token?: string) => {
    if (token) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch {
        // ignore
      }
    }
    setUser(userData);
  };

  const loginWithGoogle = async (credential: string): Promise<AuthUser> => {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ credential }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Google authentication failed");
    }

    if (data.token) {
      try {
        localStorage.setItem(TOKEN_KEY, data.token);
      } catch {
        // ignore
      }
    }

    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      window.location.href = "/";
    }
  };

  const updateProfile = async (data: { name?: string; telegramUsername?: string; brandName?: string }) => {
    const res = await authFetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || "Failed to update profile");
    }

    setUser(body.user);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const res = await authFetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || "Failed to change password");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        refreshUser,
        authFetch,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
