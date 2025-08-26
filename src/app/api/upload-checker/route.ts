import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get('file');
    const path = (form.get('path')?.toString() || form.get('key')?.toString() || '').trim();

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    let filename = 'checker.bin';
    if (file instanceof File && typeof file.name === 'string') filename = file.name;

    let key = path || filename;
    if (!key.startsWith('checkers/')) key = `checkers/${key}`;

    const [{ S3Client, PutObjectCommand, GetObjectCommand }, { getSignedUrl }] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
    ]);

    const s3 = new S3Client({
      region: env.STORAGE_REGION || 'auto',
      endpoint: env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
      forcePathStyle: false,
    }) as InstanceType<typeof S3Client>;

    const fileBlob = file as Blob;
    const buffer = Buffer.from(await fileBlob.arrayBuffer());

  await s3.send(new PutObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key, Body: buffer }));

  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }), { expiresIn: 3600 });

    return NextResponse.json({ url, key, name: filename });
  } catch (err) {
    console.error('upload-checker error', err);
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
