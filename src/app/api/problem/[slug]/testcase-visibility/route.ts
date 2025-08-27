import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { slug } = await params;
    const { visibility } = await request.json();

    if (
      !visibility ||
      !["AUTHOR_ONLY", "AC_ONLY", "EVERYONE"].includes(visibility)
    ) {
      return NextResponse.json(
        { error: "Invalid visibility value" },
        { status: 400 },
      );
    }

    // Make request to backend server to update test case visibility
    const backendResponse = await fetch(
      new URL(
        `/client/problems/${slug}/testcase-visibility`,
        env.API_ENDPOINT,
      ).toString(),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.sessionToken}`,
        },
        body: JSON.stringify({ visibility }),
      },
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to update test case visibility" },
        { status: backendResponse.status },
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating test case visibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
