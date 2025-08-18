import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { problemCode, language, sourceCode } = body;

    if (!problemCode || !language || !sourceCode) {
      return NextResponse.json(
        { error: "Problem code, language, and source code are required" },
        { status: 400 }
      );
    }

    // Proxy to backend API
    const apiBase = process.env.API_ENDPOINT;
    if (!apiBase) {
      return NextResponse.json(
        { error: "Backend API not configured" },
        { status: 500 }
      );
    }

    // First, get the problem details to get the ID
    const problemResponse = await fetch(new URL(`/client/problems/details/${problemCode}`, apiBase).toString(), {
      headers: {
        Authorization: `Bearer ${session.sessionToken}`,
      },
    });

    if (!problemResponse.ok) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    const problemData = await problemResponse.json();

    const response = await fetch(new URL("/client/submissions", apiBase).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.sessionToken}`,
      },
      body: JSON.stringify({
        problemId: problemData.id,
        language,
        code: sourceCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to submit solution" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Submission API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    const problemCode = searchParams.get("problemCode");
    const author = searchParams.get("author");

    // Proxy to backend API
    const apiBase = process.env.API_ENDPOINT;
    if (!apiBase) {
      return NextResponse.json(
        { error: "Backend API not configured" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      page,
      limit,
      ...(problemCode && { problemCode }),
      ...(author && { author }),
    });

    const response = await fetch(
      new URL(`/client/submissions?${params}`, apiBase).toString(),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.sessionToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch submissions" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Submissions fetch API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
