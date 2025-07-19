import { NextResponse } from "next/server";
import { clearAuthSession } from "@/lib/auth";

export const runtime = "edge";

export async function POST() {
  await clearAuthSession();
  return NextResponse.json({ success: true });
}
