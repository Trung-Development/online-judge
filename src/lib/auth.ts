"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface User {
  id: string;
  email: string;
  username: string;
  fullname: string;
}

export interface AuthSession {
  sessionToken: string;
  sessionExpires: number;
  user: User;
}

const COOKIE_NAME = "auth-session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// Decode JWT token to extract session data
function decodeJWT(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

export async function setAuthSession(sessionToken: string, user: User): Promise<void> {
  const cookieStore = await cookies();
  
  // Decode JWT to get expiry
  const decodedSession = decodeJWT(sessionToken);
  const sessionExpires = decodedSession?.expiresAt 
    ? Date.parse(decodedSession.expiresAt)
    : Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days default
  
  const session: AuthSession = {
    sessionToken,
    sessionExpires,
    user,
  };
  
  cookieStore.set(COOKIE_NAME, JSON.stringify(session), COOKIE_OPTIONS);
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    const session: AuthSession = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (Date.now() > session.sessionExpires) {
      await clearAuthSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error("Failed to parse session cookie:", error);
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  
  if (!session) {
    redirect("/accounts/login");
  }
  
  return session;
}

export async function getUser(): Promise<User | null> {
  const session = await getAuthSession();
  return session?.user || null;
}
