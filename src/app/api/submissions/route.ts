import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const contentType = request.headers.get("content-type") || "";

    let response: Response;

    if (contentType.includes("multipart/form-data")) {
      // Edge: use request.formData() to parse multipart body
      const form = await request.formData();
      const file = form.get("file");
      const problemSlug = form.get("problemSlug")?.toString() || "";
      const language = form.get("language")?.toString() || "";
      const sourceCode = form.get("sourceCode")?.toString() || undefined;
      // backend expects 'code' field name, include it when present
      const codeField = form.get("code")?.toString() || undefined;

      if (!problemSlug || !language) {
        return NextResponse.json(
          { error: "Problem slug and language are required" },
          { status: 400 },
        );
      }

      const forward = new FormData();
      // forward file if present
      if (file) {
        const fileBlob = file as Blob;
        let maybeName = "upload";
        if (file instanceof File && typeof file.name === "string")
          maybeName = file.name;
        forward.append("file", fileBlob, maybeName);
      }
      forward.append("problemSlug", problemSlug);
      forward.append("language", language);
      if (sourceCode) forward.append("sourceCode", sourceCode);
      // backend requires a non-empty `code` string; if none provided, use a short placeholder
      const codeToSend =
        codeField || sourceCode || (file ? "[binary submission]" : "");
      forward.append("code", codeToSend);

      // When a file is present, forward to the backend upload endpoint so
      // the NestJS controller's multipart handler (`POST /client/submissions/upload`)
      // receives the request and processes the file properly.
      response = await fetch(
        new URL("/client/submissions/upload", env.API_ENDPOINT).toString(),
        {
          method: "POST",
          headers: {
            ...(session?.sessionToken && {
              Authorization: `Bearer ${session.sessionToken}`,
            }),
          },
          body: forward,
        },
      );
    } else {
      const body = await request.json();
      const { problemSlug, language, sourceCode } = body;

      if (!problemSlug || !language || !sourceCode) {
        return NextResponse.json(
          { error: "Problem slug, language, and source code are required" },
          { status: 400 },
        );
      }

      const submissionPayload = {
        problemSlug: problemSlug, // Backend now expects problemSlug instead of problemId
        language,
        code: sourceCode,
      };

      response = await fetch(
        new URL("/client/submissions", env.API_ENDPOINT).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.sessionToken && {
              Authorization: `Bearer ${session.sessionToken}`,
            }),
          },
          body: JSON.stringify(submissionPayload),
        },
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to submit solution" },
        { status: response.status },
      );
    }

    const result = await response.json();

    // Backend returns { success: true, data: submission }
    // Frontend expects just the submission data
    const submissionData = result.data || result;

    return NextResponse.json(submissionData);
  } catch (error) {
    console.error("Submission API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    const { searchParams } = new URL(request.url);
    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "20";
    const problemSlug = searchParams.get("problemSlug");
    const author = searchParams.get("author");
    const verdict = searchParams.get("verdict");

    // Validate that page and limit are valid integers
    const page = parseInt(pageStr, 10);
    const limit = parseInt(limitStr, 10);

    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid page parameter" },
        { status: 400 },
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter (must be 1-100)" },
        { status: 400 },
      );
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(problemSlug && { problemSlug }),
      ...(author && { author }),
      ...(verdict && { verdict }),
    });

    const response = await fetch(
      new URL(`/client/submissions?${params}`, env.API_ENDPOINT).toString(),
      {
        method: "GET",
        headers: {
          ...(session?.sessionToken && {
            Authorization: `Bearer ${session.sessionToken}`,
          }),
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch submissions" },
        { status: response.status },
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Submissions fetch API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
