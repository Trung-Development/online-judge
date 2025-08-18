import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { problemCode, language, sourceCode } = body;

    if (!problemCode || !language || !sourceCode) {
      return NextResponse.json(
        { error: "Problem code, language, and source code are required" },
        { status: 400 }
      );
    }

    // First, get the problem details to get the ID
    const problemResponse = await fetch(new URL(`/client/problems/details/${problemCode}`, env.API_ENDPOINT).toString(), {
      headers: {
        Authorization: `Bearer ${session.sessionToken}`,
      },
    });

    if (!problemResponse.ok) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    const problemData = await problemResponse.json();
    
    console.log('Problem data received:', problemData);
    console.log('Problem ID type:', typeof problemData.id, 'Value:', problemData.id);

    const submissionPayload = {
      problemId: parseInt(problemData.id, 10), // Ensure it's a number
      language,
      code: sourceCode,
    };
    
    console.log('Submission payload:', submissionPayload);
    console.log('Problem ID type after parseInt:', typeof submissionPayload.problemId);

    const response = await fetch(new URL("/client/submissions", env.API_ENDPOINT).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.sessionToken}`,
      },
      body: JSON.stringify(submissionPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend submission error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      return NextResponse.json(
        { error: errorData.message || "Failed to submit solution" },
        { status: response.status }
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
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    const problemCode = searchParams.get("problemCode");
    const author = searchParams.get("author");

    const params = new URLSearchParams({
      page,
      limit,
      ...(problemCode && { problemCode }),
      ...(author && { author }),
    });

    const response = await fetch(
      new URL(`/client/submissions?${params}`, env.API_ENDPOINT).toString(),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.sessionToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch submissions" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Submissions fetch API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
