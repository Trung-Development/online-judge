import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getAuthSession } from "@/lib/auth";
import { UserPermissions, hasPermission } from "@/lib/permissions";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    // Allow users who can create problems, or who can edit problem tests (manage)
    const perms = session.user?.perms;
    const allowed = hasPermission(perms, UserPermissions.CREATE_NEW_PROBLEM);
    if (!allowed)
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "INVALID_CONTENT_TYPE" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slug = (formData.get("slug") as string) || "temp";
    if (!file) return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
    // Basic validation
    if (!file.type || !file.type.includes("pdf")) {
      return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
    }

    const pdf = uuidv4();
    const key = `pdf/${slug}/${pdf}.pdf`;

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    // Upload to S3-compatible storage using aws-sdk v3
    try {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = new S3Client({
        region: process.env.STORAGE_REGION || "auto",
        endpoint: process.env.STORAGE_ENDPOINT,
        credentials: {
          accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || "",
        },
        forcePathStyle: false,
      });

      await client.send(
        new PutObjectCommand({
          Bucket: process.env.STORAGE_BUCKET,
          Key: key,
          Body: body,
          ContentType: "application/pdf",
        }),
      );

      // Construct URL (signed generation left to callers) — return s3:// path
      const url = `s3://${process.env.STORAGE_BUCKET}/${key}`;
      return NextResponse.json({ pdf, key, url });
    } catch (e) {
      console.error("PDF upload failed", e);
      return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
    }
  } catch (e) {
    console.error("pdf-upload error", e);
    return NextResponse.json({ error: "UNKNOWN" }, { status: 500 });
  }
}
