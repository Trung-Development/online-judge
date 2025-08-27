import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const base = env.API_ENDPOINT;
    const url = new URL('/client/categories/all', base).toString();
    const headers: Record<string, string> = {};
    const auth = req.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    const res = await fetch(url, { headers });
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('proxy categories/all error', e);
    return NextResponse.json({ error: 'PROXY_ERROR' }, { status: 500 });
  }
}
