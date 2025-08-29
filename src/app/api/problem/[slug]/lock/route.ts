import { changeLockStatus } from "@/lib/server-actions/problems";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const token =
      _req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      undefined;

    const result = await changeLockStatus(slug, token);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(JSON.stringify({ message }), { status: 500 });
  }
}
