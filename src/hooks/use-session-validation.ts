"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useCallback } from "react";
import {
  validateUserSession,
  getCurrentSession,
  logoutAllSessions as serverLogoutAllSessions,
  getActiveSessions as serverGetActiveSessions,
} from "@/lib/server-actions/sessions";

export function useSessionValidation() {
  const { sessionToken, logout, isAuthenticated } = useAuth();

  const validateSession = useCallback(async () => {
    // Only validate if we have a session and session token
    if (!isAuthenticated || !sessionToken) {
      return false;
    }

    try {
      const isValid = await validateUserSession(sessionToken);

      // If the session is invalid, sign out
      if (!isValid) {
        await logout();
        return false;
      }

      return true;
    } catch {
      // On network errors, we might want to keep the session
      // but log the error for debugging
      return true;
    }
  }, [sessionToken, isAuthenticated, logout]);

  const logoutAllSessions = useCallback(async () => {
    // Logout from all sessions
    if (sessionToken) {
      try {
        await serverLogoutAllSessions(sessionToken);
      } catch (error) {
        console.error("Failed to logout all sessions:", error);
      }
    }
    await logout();
  }, [sessionToken, logout]);

  const getCurrentSessionData = useCallback(async () => {
    if (!sessionToken) {
      return null;
    }

    try {
      return await getCurrentSession(sessionToken);
    } catch (error) {
      console.error("Error fetching current session:", error);
      return null;
    }
  }, [sessionToken]);

  const getActiveSessionsData = useCallback(async () => {
    if (!sessionToken) {
      return [];
    }

    try {
      return await serverGetActiveSessions(sessionToken);
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      return [];
    }
  }, [sessionToken]);

  return {
    validateSession,
    logout,
    logoutAllSessions,
    getCurrentSession: getCurrentSessionData,
    getActiveSessions: getActiveSessionsData,
    isAuthenticated,
  };
}

export function usePeriodicSessionValidation(intervalMs: number = 60000) {
  const { validateSession, isAuthenticated } = useSessionValidation();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

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
  }, [validateSession, intervalMs, isAuthenticated]);
}
