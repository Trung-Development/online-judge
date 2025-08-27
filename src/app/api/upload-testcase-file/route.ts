import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";

// This route returns presigned PUT (upload) and GET (download) URLs for
// storing testcase archives under `tests/{slug}/{filename}`. Frontend
// should PUT the file directly to `uploadUrl` and then call the finalize
// forwarder with the `downloadUrl` so the backend can validate the archive.
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    const path = (
      form.get("path")?.toString() ||
      form.get("key")?.toString() ||
      ""
    ).trim();

    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Determine object key. If path provided, use it; otherwise default to tests/{slug}/{filename}
    let filename = "upload.zip";
    if (file instanceof File && typeof file.name === "string")
      filename = file.name;

    let key = path || filename;
    if (!key.startsWith("tests/")) {
      // Expect callers to provide tests/<slug> prefix; fall back to tests/<unknown>/<filename>
      key = `tests/${filename}`;
    }

    // Upload buffer to object storage server-side to avoid browser CORS
    const [{ S3Client, PutObjectCommand, GetObjectCommand }, { getSignedUrl }] =
      await Promise.all([
        import("@aws-sdk/client-s3"),
        import("@aws-sdk/s3-request-presigner"),
      ]);

    const s3 = new S3Client({
      region: env.STORAGE_REGION || "auto",
      endpoint: env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
      forcePathStyle: false,
    }) as InstanceType<typeof S3Client>;

    // Read file buffer
    const fileBlob = file as Blob;
    const buffer = Buffer.from(await fileBlob.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: env.STORAGE_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "application/zip",
      }),
    );

    // Generate a short-lived presigned GET URL that backend finalize can use to download
    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }),
      { expiresIn: 900 },
    );

    return NextResponse.json({ url: downloadUrl, name: filename, key });
  } catch (err) {
    console.error("upload-testcase-file server upload error", err);
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}
