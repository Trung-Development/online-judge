import { createProblem } from "@/lib/server-actions/problems";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || undefined;

    const created = await createProblem(body, token);

    return new Response(JSON.stringify(created), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
