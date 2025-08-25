import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { slug } = await params;
    const body = await request.json().catch(() => ({}));

    const backendUrl = new URL(`/client/problem/${encodeURIComponent(slug)}/finalize-testcase-upload`, env.API_ENDPOINT).toString();

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.sessionToken && { Authorization: `Bearer ${session.sessionToken}` }),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => null);
      return NextResponse.json({ error: e?.message || 'FINALIZE_FAILED' }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    console.error('finalize forwarder error', err);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
