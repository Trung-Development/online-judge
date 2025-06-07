import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ user: null, sessionToken: null });
    }

    return NextResponse.json({
      user: session.user,
      sessionToken: session.sessionToken,
      sessionExpires: session.sessionExpires,
    });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ user: null, sessionToken: null });
  }
}
