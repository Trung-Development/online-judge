"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { Config } from "@/config";

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
  // Accept either base64 or hex input. Detect hex (only 0-9a-f chars, even length)
  const isHex = /^[0-9a-fA-F]+$/.test(b64) && b64.length % 2 === 0;
  if (isHex) {
    // hex -> bytes
    if (typeof Buffer !== "undefined")
      return Uint8Array.from(Buffer.from(b64, "hex"));
    const bytes = new Uint8Array(b64.length / 2);
    for (let i = 0; i < bytes.length; i++)
      bytes[i] = parseInt(b64.substr(i * 2, 2), 16);
    return bytes;
  }

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
  if (!raw)
    throw new Error(
      "SESSION_ENC_KEY is not set; cannot encrypt session cookie",
    );

  // Expect SESSION_ENC_KEY to be base64 encoding of at least 32 bytes (256 bits)
  const keyBytes = base64ToUint8Array(raw);
  if (keyBytes.length < 32)
    throw new Error(
      "SESSION_ENC_KEY must decode to at least 32 bytes (256 bits)",
    );
  const cryptoObj = globalThis as unknown as { crypto?: Crypto };
  const subtle = cryptoObj.crypto?.subtle;
  if (!subtle)
    throw new Error(
      "WebCrypto Subtle API not available for session encryption",
    );

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
  // Try WebCrypto first
  if (Config.encryptAuthCookies == false)
    throw new Error("Cookie encryption force disabled by config");
  try {
    const key = await getCryptoKey();
    const cryptoObj = globalThis as unknown as { crypto?: Crypto };
    const subtle = cryptoObj.crypto!.subtle;
    const iv = cryptoObj.crypto!.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const data = enc.encode(plain);
    const cipherBuf = await subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    const cipher = new Uint8Array(cipherBuf);
    // store as base64(iv + cipher)
    const out = new Uint8Array(iv.length + cipher.length);
    out.set(iv, 0);
    out.set(cipher, iv.length);
    return uint8ArrayToBase64(out);
  } catch (err: unknown) {
    // Let caller handle fallback (e.g., write plaintext cookie). Avoid attempting
    // to require Node crypto in Edge runtimes where that is forbidden.
    const e = err as Error;
    console.warn("WebCrypto encrypt failed:", e?.name ?? e?.message ?? e);
    throw err;
  }
}

async function decryptString(b64: string): Promise<string> {
  // Try WebCrypto first
  try {
    const key = await getCryptoKey();
    const cryptoObj = globalThis as unknown as { crypto?: Crypto };
    const subtle = cryptoObj.crypto!.subtle;
    const data = base64ToUint8Array(b64);
    if (data.length < 13) throw new Error("Encrypted session cookie too short");
    const iv = data.slice(0, 12);
    const cipher = data.slice(12);
    const plainBuf = await subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    const dec = new TextDecoder();
    return dec.decode(new Uint8Array(plainBuf));
  } catch (err: unknown) {
    const e = err as Error;
    console.warn("WebCrypto decrypt failed:", e?.name ?? e?.message ?? e);
    // Bubble up to caller so session parsing falls back or clears the cookie.
    throw err;
  }
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

export async function setAuthSession(
  sessionToken: string,
  user: User,
): Promise<void> {
  const cookieStore = await cookies();

  // Decode JWT to get expiry
  const decodedSession = decodeJWT(sessionToken);
  const sessionExpires = decodedSession?.expiresAt
    ? Date.parse(decodedSession.expiresAt)
    : Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days default

  const session: AuthSession = {
    sessionToken,
    sessionExpires,
    user,
  };
  // Encrypt session payload before storing in cookie. If encryption fails
  // (missing key, WebCrypto unavailable), fall back to plain JSON to avoid
  // blocking login. This maintains backward compatibility with existing
  // deployments while preferring encrypted cookies when possible.
  if (Config.encryptAuthCookies == true) {
    try {
      const encrypted = await encryptString(JSON.stringify(session));
      cookieStore.set(COOKIE_NAME, encrypted, COOKIE_OPTIONS);
    } catch (e) {
      throw new Error(
        `Failed to encrypt session cookie: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  } else if (Config.encryptAuthCookies == false) {
    try {
      cookieStore.set(COOKIE_NAME, JSON.stringify(session), COOKIE_OPTIONS);
    } catch (e2) {
      throw new Error(
        `Failed to set plaintext session cookie: ${e2 instanceof Error ? e2.message : String(e2)}`,
      );
    }
  } else {
    try {
      const encrypted = await encryptString(JSON.stringify(session));
      cookieStore.set(COOKIE_NAME, encrypted, COOKIE_OPTIONS);
    } catch (e) {
      console.info(
        "Failed to encrypt session cookie, falling back to plaintext cookie:",
        e,
      );
      try {
        cookieStore.set(COOKIE_NAME, JSON.stringify(session), COOKIE_OPTIONS);
      } catch (e2) {
        console.error(
          "Failed to set plaintext session cookie as fallback:",
          e2,
        );
        throw e2;
      }
    }
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    // Heuristic: if cookie value appears to be plain JSON, parse it directly
    // (backwards compatibility with unencrypted cookies). Encrypted values
    // are base64/hex and won't start with '{' or '['.
    const raw = sessionCookie.value;
    let session: AuthSession;
    if (raw && (raw[0] === "{" || raw[0] === "[")) {
      try {
        session = JSON.parse(raw);
      } catch {
        // fall through to decrypt attempt
        session = JSON.parse(await decryptString(raw));
      }
    } else {
      const decrypted = await decryptString(raw);
      session = JSON.parse(decrypted);
    }

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
