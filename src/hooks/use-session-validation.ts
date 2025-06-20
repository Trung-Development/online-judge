"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useCallback } from "react";

export function useSessionValidation() {
  const { data: session, status } = useSession();

  const validateSession = useCallback(async () => {
    // Only validate if we have a session and access token
    if (status !== "authenticated" || !session?.accessToken) {
      return false;
    }

    // Check if there's a token refresh error
    if ('error' in session && session.error === 'RefreshAccessTokenError') {
      console.log("Token refresh failed, signing out");
      await signOut({ callbackUrl: "/accounts/login" });
      return false;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/client/users/me`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        },
      );

      // If we get a 401 Unauthorized, the session is invalid
      if (response.status === 401) {
        console.log("Session expired or invalid, signing out");
        // Sign out without calling DELETE since the session is already invalid
        await signOut({ callbackUrl: "/accounts/login" });
        return false;
      }

      // Check for IP mismatch or other security violations
      if (response.status === 403) {
        console.log("Security violation detected, signing out");
        await signOut({ callbackUrl: "/accounts/login" });
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error("Error validating session:", error);
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
    if (session?.accessToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/client/sessions/logout-all`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
      } catch (error) {
        console.error("Failed to logout all sessions:", error);
      }
    }
    await signOut({ callbackUrl: "/accounts/login" });
  }, [session]);

  const getActiveSessions = useCallback(async () => {
    if (!session?.accessToken) {
      return [];
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/client/sessions/active`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
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
    getActiveSessions,
    isAuthenticated: status === "authenticated" && !!session?.accessToken
  };
}

export function usePeriodicSessionValidation(intervalMs: number = 60000) {
  const { validateSession } = useSessionValidation();

  useEffect(() => {
    // Don't start validation immediately to avoid conflicts with initial load
    const timer = setTimeout(() => {
      validateSession();
      
      // Set up periodic validation
      const interval = setInterval(validateSession, intervalMs);
      
      return () => clearInterval(interval);
    }, 5000); // Wait 5 seconds before first validation

    return () => clearTimeout(timer);
  }, [validateSession, intervalMs]);
}
