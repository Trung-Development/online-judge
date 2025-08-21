"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/lib/auth";
import { env } from "@/lib/env";

export interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (sessionToken: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!sessionToken;

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const sessionData = await response.json();
        if (sessionData.user && sessionData.sessionToken) {
          setUser(sessionData.user);
          setSessionToken(sessionData.sessionToken);
        } else {
          setUser(null);
          setSessionToken(null);
        }
      } else {
        setUser(null);
        setSessionToken(null);
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      setUser(null);
      setSessionToken(null);
    }
  }, []);

  const login = useCallback((newSessionToken: string, userData: User) => {
    setSessionToken(newSessionToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    // Call backend to delete session
    if (sessionToken) {
      try {
        const apiBase = env.API_ENDPOINT;
        if (apiBase) {
          await fetch(new URL("/client/sessions/me", apiBase).toString(), {
            method: "DELETE",
            headers: { Authorization: `Bearer ${sessionToken}` },
          });
        }
      } catch (error) {
        console.error("Failed to delete session on backend:", error);
      }
    }

    // Call frontend API to clear cookie
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Failed to clear session cookie:", error);
    }

    setUser(null);
    setSessionToken(null);
    
    // Redirect to login page
    window.location.href = "/accounts/login";
  }, [sessionToken]);

  // Initial session load
  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  const value: AuthContextType = {
    user,
    sessionToken,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
