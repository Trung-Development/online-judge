import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiEndpoint = process.env.API_ENDPOINT || 'http://localhost:50829';
    const response = await fetch(`${apiEndpoint}/client/judge/executors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();
    
    // Backend now returns array directly
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching judge executors:', error);
    return NextResponse.json([], { status: 200 });
  }
}
