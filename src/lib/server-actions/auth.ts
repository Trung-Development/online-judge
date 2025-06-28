"use server";

import { headers } from "next/headers";

interface SignupData {
  fullname: string;
  username: string;
  email: string;
  password: string;
  defaultLanguage: string;
  dateOfBirth?: string;
  captchaToken: string;
}

interface SignupResult {
  success: boolean;
  error?: string;
}

type SignupErrorData = {
  message?: string;
  [key: string]: unknown;
};

// Helper to classify signup error codes/messages
function parseSignupError(status: number, errorData: SignupErrorData): string {
  if (typeof errorData?.message === "string") {
    switch (errorData.message) {
      case "EMAIL_IN_USE":
        return "Email is already in use";
      case "USERNAME_UNAVAILABLE":
        return "Username is already in use";
      default:
        return errorData.message;
    }
  }
  
  return "An error occurred during signup";
}

// Get client IP from headers
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Cloudflare
  const cfConnecting = headersList.get("cf-connecting-ip");
  if (cfConnecting) return cfConnecting;

  // Standard forwarded headers
  const xForwardedFor = headersList.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  // Other common headers
  const xRealIp = headersList.get("x-real-ip");
  if (xRealIp) return xRealIp;

  const xClientIp = headersList.get("x-client-ip");
  if (xClientIp) return xClientIp;

  const xForwarded = headersList.get("x-forwarded");
  if (xForwarded) return xForwarded.split(",")[0].trim();

  const forwardedFor = headersList.get("forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const forwarded = headersList.get("forwarded");
  if (forwarded) {
    const match = forwarded.match(/for=([^;]+)/);
    if (match) return match[1];
  }

  return "unknown";
}

// Server action for user registration
export async function registerUser(data: SignupData): Promise<SignupResult> {
  try {
    const apiBase =
      process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;
    if (!apiBase) {
      return { success: false, error: "API endpoint not configured" };
    }

    const clientIp = await getClientIP();

    const submitData = {
      ...data,
      clientIp,
    };

    const apiUrl = new URL("/client/users", apiBase).toString();

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitData),
    });

    if (response.status !== 201) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: parseSignupError(response.status, errorData),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);

    // Check for network/server unreachable error
    if (
      error instanceof TypeError &&
      error.message &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Network request failed"))
    ) {
      return {
        success: false,
        error: "The server is unreachable. Please contact the administrator.",
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred during signup",
    };
  }
}
