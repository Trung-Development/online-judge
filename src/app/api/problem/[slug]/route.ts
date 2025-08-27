import { NextResponse } from "next/server";
import {
  getProblem,
  updateProblem,
  deleteProblem,
} from "@/lib/server-actions/problems";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const data = await getProblem(slug);
    if (data === 404)
      return new NextResponse(JSON.stringify({ error: "PROBLEM_NOT_FOUND" }), {
        status: 404,
      });
    if (data === 403)
      return new NextResponse(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
      });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(JSON.stringify({ message }), { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const token =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || undefined;
    const updated = await updateProblem(slug, body, token);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(JSON.stringify({ message }), { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const token =
      _req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      undefined;
    const deleted = await deleteProblem(slug, token);
    return NextResponse.json(deleted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(JSON.stringify({ message }), { status: 500 });
  }
}
