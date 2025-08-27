import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const base = env.API_ENDPOINT;
    const url = new URL('/client/types/names', base).toString();
    const headers: Record<string, string> = {};
    const auth = req.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    const res = await fetch(url, { headers, next: { revalidate: 60 } });
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('proxy types/names error', e);
    return NextResponse.json({ error: 'PROXY_ERROR' }, { status: 500 });
  }
}
