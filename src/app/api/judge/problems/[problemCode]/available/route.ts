import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET(
  request: NextRequest,
  { params }: { params: { problemCode: string } }
) {
  try {
    const { problemCode } = params;
    
    const response = await fetch(
      new URL(`/client/judge/problems/${problemCode}/available`, env.API_ENDPOINT).toString(),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ problemCode, available: false });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking problem availability:', error);
    return NextResponse.json({ problemCode: params.problemCode, available: false });
  }
}
