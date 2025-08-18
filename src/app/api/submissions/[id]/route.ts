import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Valid submission ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      new URL(`/client/submissions/${id}`, env.API_ENDPOINT).toString(),
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
        { error: errorData.message || "Failed to fetch submission" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Submission fetch API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
