import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Extract real client IP from headers
  const getClientIp = (req: NextRequest) => {
    const headers = req.headers;

    // Cloudflare
    const cfConnecting = headers.get("cf-connecting-ip");
    if (cfConnecting) return cfConnecting;

    // Standard forwarded headers
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
      return xForwardedFor.split(",")[0].trim();
    }

    // Other common headers
    const xRealIp = headers.get("x-real-ip");
    if (xRealIp) return xRealIp;

    const xClientIp = headers.get("x-client-ip");
    if (xClientIp) return xClientIp;

    const xForwarded = headers.get("x-forwarded");
    if (xForwarded) return xForwarded.split(",")[0].trim();

    const forwardedFor = headers.get("forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();

    const forwarded = headers.get("forwarded");
    if (forwarded) {
      const match = forwarded.match(/for=([^;]+)/);
      if (match) return match[1];
    }

    // Fallback
    return "unknown";
  };

  const clientIp = getClientIp(request);

  return NextResponse.json({ ip: clientIp });
}
