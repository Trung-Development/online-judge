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
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const slug = body.slug || body.problemSlug || body.problem || "";
    const filename = body.filename || body.name || "upload.zip";

    if (!slug) return NextResponse.json({ error: "MISSING_SLUG" }, { status: 400 });

    // Build object key
    const key = `tests/${slug}/${filename}`;

    const bucket = env.STORAGE_BUCKET;
    const endpoint = env.STORAGE_ENDPOINT;
    const region = env.STORAGE_REGION || "auto";

    // Import AWS SDK helpers dynamically to avoid edge/runtime issues
    const [{ S3Client, PutObjectCommand, GetObjectCommand }, { getSignedUrl }] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
    ]);

    const s3 = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
      forcePathStyle: false,
    });

    // Presign PUT (upload)
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: 'application/zip' }),
      { expiresIn: 900 },
    );

    // Presign GET (download) so the backend finalize step can immediately fetch
    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 900 },
    );

    return NextResponse.json({ uploadUrl, downloadUrl, key });
  } catch (err) {
    console.error('upload-testcase-file presign error', err);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
