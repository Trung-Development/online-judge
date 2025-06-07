import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ problemSlug: string }> },
) {
  try {
    const { problemSlug } = await context.params;

    const response = await fetch(
      new URL(
        `/client/judge/problems/${problemSlug}/available`,
        env.API_ENDPOINT,
      ).toString(),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json({ problemSlug, available: false });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error checking problem availability:", error);
    const { problemSlug } = await context.params;
    return NextResponse.json({ problemSlug, available: false });
  }
}
