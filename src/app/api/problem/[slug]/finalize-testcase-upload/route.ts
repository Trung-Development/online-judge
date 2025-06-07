import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const { slug } = await params;
    const body = await request.json().catch(() => ({}));

    const backendUrl = new URL(
      `/client/problems/${encodeURIComponent(slug)}/finalize-testcase-upload`,
      env.API_ENDPOINT,
    ).toString();

    // Allow passing checker metadata and selected indices
    type FinalizePayload = {
      cases: Array<{ input: string; output?: string; type?: string }>;
      checker?:
        | { url?: string; key?: string; name?: string }
        | { default?: true }
        | null;
      selectedIndices?: number[] | null;
      ioInputFile?: string | null;
      ioOutputFile?: string | null;
    };

    const payload: FinalizePayload = {
      cases: body.cases || [],
      checker: body.checker || null,
      selectedIndices: body.selectedIndices || null,
      ioInputFile: body.ioInputFile || null,
      ioOutputFile: body.ioOutputFile || null,
    };

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.sessionToken && {
          Authorization: `Bearer ${session.sessionToken}`,
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => null);
      return NextResponse.json(
        { error: e?.message || "FINALIZE_FAILED" },
        { status: res.status },
      );
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    console.error("finalize forwarder error", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
