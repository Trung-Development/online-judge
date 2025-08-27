import { NextRequest } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "edge";

const s3 = new S3Client({
  region: process.env.STORAGE_REGION || "auto",
  endpoint: process.env.STORAGE_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.STORAGE_ENDPOINT),
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;

  try {
    console.log(`Fetching PDF for filename: ${filename}`);
    const command = new GetObjectCommand({
      Bucket: process.env.STORAGE_BUCKET!,
      Key: `pdf/${filename}.pdf`,
    });
    const { Body } = await s3.send(command);

    return new Response(Body as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error fetching PDF:", error);
    return new Response("File not found", { status: 404 });
  }
}
