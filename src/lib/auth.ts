"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export interface User {
  id: string;
  email: string;
  username: string;
  fullname: string;
  defaultRuntime: string; // Default runtime on signup, able to change
  perms?: string; // Permission bits as string (from backend)
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

// Encryption key cache
let _cryptoKey: CryptoKey | null = null;

function base64ToUint8Array(b64: string) {
  try {
    // atob expects a base64 string
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch (e) {
    // fallback: try Buffer (node)
    if (typeof Buffer !== "undefined") {
      return Uint8Array.from(Buffer.from(b64, "base64"));
    }
    throw e;
  }
}

function uint8ArrayToBase64(u8: Uint8Array) {
  try {
    let s = "";
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return btoa(s);
  } catch (e) {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(u8).toString("base64");
    }
    throw e;
  }
}

async function getCryptoKey(): Promise<CryptoKey> {
  if (_cryptoKey) return _cryptoKey;
  const raw = env.SESSION_ENC_KEY || "";
  if (!raw) throw new Error("SESSION_ENC_KEY is not set; cannot encrypt session cookie");

  // Expect SESSION_ENC_KEY to be base64 encoding of at least 32 bytes (256 bits)
  const keyBytes = base64ToUint8Array(raw);
  if (keyBytes.length < 32) throw new Error("SESSION_ENC_KEY must decode to at least 32 bytes (256 bits)");
  const cryptoObj = (globalThis as unknown) as { crypto?: Crypto };
  const subtle = cryptoObj.crypto?.subtle;
  if (!subtle) throw new Error("WebCrypto Subtle API not available for session encryption");

  _cryptoKey = await subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" } as unknown as AesKeyAlgorithm,
    false,
    ["encrypt", "decrypt"],
  );
  if (!_cryptoKey) throw new Error("Failed to import crypto key");
  return _cryptoKey;
}

async function encryptString(plain: string): Promise<string> {
  const key = await getCryptoKey();
  const cryptoObj = (globalThis as unknown) as { crypto?: Crypto };
  const subtle = cryptoObj.crypto!.subtle;
  const iv = cryptoObj.crypto!.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const data = enc.encode(plain);
  const cipher = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  // store as base64(iv + cipher)
  const out = new Uint8Array(iv.length + cipher.length);
  out.set(iv, 0);
  out.set(cipher, iv.length);
  return uint8ArrayToBase64(out);
}

async function decryptString(b64: string): Promise<string> {
  const key = await getCryptoKey();
  const cryptoObj = (globalThis as unknown) as { crypto?: Crypto };
  const subtle = cryptoObj.crypto!.subtle;
  const data = base64ToUint8Array(b64);
  if (data.length < 13) throw new Error("Encrypted session cookie too short");
  const iv = data.slice(0, 12);
  const cipher = data.slice(12);
  const plainBuf = await subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  const dec = new TextDecoder();
  return dec.decode(new Uint8Array(plainBuf));
}

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
  // Encrypt session payload before storing in cookie
  try {
    const encrypted = await encryptString(JSON.stringify(session));
    cookieStore.set(COOKIE_NAME, encrypted, COOKIE_OPTIONS);
  } catch (e) {
    console.error("Failed to encrypt session cookie:", e);
    throw e;
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    // Decrypt cookie value then parse
    const decrypted = await decryptString(sessionCookie.value);
    const session: AuthSession = JSON.parse(decrypted);
    
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
