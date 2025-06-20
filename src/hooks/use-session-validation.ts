"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useCallback } from "react";

export function useSessionValidation() {
  const { data: session, status } = useSession();

  const validateSession = useCallback(async () => {
    // Only validate if we have a session and session token
    if (status !== "authenticated" || !session?.sessionToken) {
      return false;
    }

    // Check if there's a session expired error
    if ('error' in session && session.error === 'SessionExpired') {
      return false;
    }

    try {
      const response = await fetch(
        new URL("/client/users/me", process.env.NEXT_PUBLIC_API_ENDPOINT!).toString(),
        {
          headers: { Authorization: `Bearer ${session.sessionToken}` },
        },
      );

      // If we get a 401 Unauthorized, the session is invalid
      if (response.status === 401) {
        // Sign out without calling DELETE since the session is already invalid
        await signOut({ callbackUrl: "/accounts/login" });
        return false;
      }

      // Check for IP mismatch or other security violations
      if (response.status === 403) {
        await signOut({ callbackUrl: "/accounts/login" });
        return false;
      }

      return response.ok;
    } catch {
      // On network errors, we might want to keep the session
      // but log the error for debugging
      return true;
    }
  }, [session, status]);

  const logout = useCallback(async () => {
    // For manual logout, we want to delete the session on the backend
    // The NextAuth signOut event handler will handle the DELETE call
    await signOut({ callbackUrl: "/accounts/login" });
  }, []);

  const logoutAllSessions = useCallback(async () => {
    // Logout from all sessions
    if (session?.sessionToken) {
      try {
        await fetch(new URL("/client/sessions/all", process.env.NEXT_PUBLIC_API_ENDPOINT!).toString(), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.sessionToken}` },
        });
      } catch (error) {
        console.error("Failed to logout all sessions:", error);
      }
    }
    await signOut({ callbackUrl: "/accounts/login" });
  }, [session]);

  const getCurrentSession = useCallback(async () => {
    if (!session?.sessionToken) {
      return null;
    }

    try {
      const response = await fetch(
        new URL("/client/sessions/me", process.env.NEXT_PUBLIC_API_ENDPOINT!).toString(),
        {
          headers: { Authorization: `Bearer ${session.sessionToken}` },
        },
      );

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error fetching current session:", error);
      return null;
    }
  }, [session]);

  const getActiveSessions = useCallback(async () => {
    if (!session?.sessionToken) {
      return [];
    }

    try {
      const response = await fetch(
        new URL("/client/sessions/all", process.env.NEXT_PUBLIC_API_ENDPOINT!).toString(),
        {
          headers: { Authorization: `Bearer ${session.sessionToken}` },
        },
      );

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      return [];
    }
  }, [session]);

  return { 
    validateSession, 
    logout, 
    logoutAllSessions, 
    getCurrentSession,
    getActiveSessions,
    isAuthenticated: status === "authenticated" && !!session?.sessionToken
  };
}

export function usePeriodicSessionValidation(intervalMs: number = 60000) {
  const { validateSession } = useSessionValidation();

  useEffect(() => {
    // Set up periodic validation
    const interval = setInterval(validateSession, intervalMs);

    // Delay the first validation to avoid conflicts with initial load
    const timer = setTimeout(() => {
      validateSession();
    }, 5000); // Wait 5 seconds before first validation

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [validateSession, intervalMs]);
}
