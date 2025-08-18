import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
  try {
    const response = await fetch(new URL('/client/judge/problems', env.API_ENDPOINT).toString(), {
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
    console.error('Error fetching judge problems:', error);
    return NextResponse.json([], { status: 200 });
  }
}
