import { NextRequest, NextResponse } from "next/server";
import { setAuthSession } from "@/lib/auth";

export const runtime = "edge";

interface LoginCredentials {
  email: string;
  password: string;
  captchaToken: string;
}

// Extract real client IP from the request
function getClientIp(request: NextRequest): string {
  // Check various headers that might contain the real client IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  const clientIp = request.headers.get("x-client-ip");
  if (clientIp) return clientIp;

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, captchaToken }: LoginCredentials = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "Unknown";

    // Get JWT session token from backend
    const sessionRes = await fetch(
      new URL("/client/sessions/", process.env.API_ENDPOINT!).toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          userAgent,
          clientIp,
          captchaToken,
        }),
      },
    );

    if (!sessionRes.ok) {
      const errorBody = await sessionRes.json();
      if (errorBody.message === "INCORRECT_CREDENTIALS") {
        return NextResponse.json(
          { error: "Incorrect email or password. Please try again." },
          { status: 401 }
        );
      }
      if(errorBody.message === "ACCOUNT_AWAITING_CONFIRMATION") {
        return NextResponse.json(
          { error: "Your account hasn't been confirmed yet. Please check your email or contact an administrator." },
          { status: 401 }
        );
      }
      if(errorBody.message === "ACCOUNT_BANNED" || errorBody.message === "ACCOUNT_DISABLED") {
        return NextResponse.json(
          { error: "Your account isn't active. Please contact an administrator for more information." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: errorBody.message || "An authentication error occurred." },
        { status: sessionRes.status }
      );
    }

    const sessionData = await sessionRes.json();
    const sessionToken = sessionData.data;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication failed: No session token received." },
        { status: 500 }
      );
    }

    // Get user data from /client/users/me using the session token
    const userRes = await fetch(
      new URL("/client/users/me", process.env.API_ENDPOINT!).toString(),
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
      },
    );

    if (!userRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user data after login." },
        { status: 500 }
      );
    }

    const userData = await userRes.json();

    // Set the auth session cookie
    await setAuthSession(sessionToken, userData);

    return NextResponse.json({
      success: true,
      user: userData,
      sessionToken,
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}
