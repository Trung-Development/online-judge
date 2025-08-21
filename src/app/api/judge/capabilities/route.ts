import { env } from '@/lib/env';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiEndpoint = env.API_ENDPOINT;
    const response = await fetch(`${apiEndpoint}/client/judge/capabilities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        status: { connected: false, judgeCount: 0 },
        problems: [],
        executors: []
      }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching judge capabilities:', error);
    return NextResponse.json({
      status: { connected: false, judgeCount: 0 },
      problems: [],
      executors: []
    }, { status: 200 });
  }
}
