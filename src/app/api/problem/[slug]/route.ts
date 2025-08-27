import { NextResponse } from "next/server";
import {
  getProblem,
  updateProblem,
  deleteProblem,
} from "@/lib/server-actions/problems";
import { env } from "@/lib/env";

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

    // If the problem currently has a pdfUuid and the incoming payload
    // explicitly clears it (null/empty/undefined), delete the previous
    // PDF object from storage to avoid orphaned files.
    try {
      const current = await getProblem(slug, token);
      const prevPdfUuid =
        current && typeof current === "object" && "pdfUuid" in current
          ? (current as { pdfUuid?: string }).pdfUuid
          : null;
      const hasPdfKey = Object.prototype.hasOwnProperty.call(body, "pdfUuid");
      const incomingPdf = hasPdfKey ? body.pdfUuid : undefined;
      const isCleared =
        prevPdfUuid &&
        (incomingPdf === null ||
          incomingPdf === undefined ||
          incomingPdf === "");

      if (isCleared) {
        try {
          const { S3Client, DeleteObjectCommand } = await import(
            "@aws-sdk/client-s3"
          );
          const s3 = new S3Client({
            region: env.STORAGE_REGION || "auto",
            endpoint: env.STORAGE_ENDPOINT,
            credentials: {
              accessKeyId: env.STORAGE_ACCESS_KEY_ID,
              secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
            },
            forcePathStyle: false,
          });
          const key = `pdf/${slug}/${prevPdfUuid}.pdf`;
          await s3.send(
            new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }),
          );
        } catch (e) {
          console.error("Failed to delete previous PDF from storage", e);
          // Non-fatal: continue to update problem record
        }
      }
    } catch (e) {
      // If fetching current problem failed, proceed to update anyway
      console.error("Failed to fetch current problem for pdf cleanup", e);
    }

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

    const result = await deleteProblem(slug, token);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(JSON.stringify({ message }), { status: 500 });
  }
}
