import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiEndpoint = process.env.API_ENDPOINT || 'http://localhost:50829';
    const response = await fetch(`${apiEndpoint}/client/judge/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        connected: false, 
        judgeCount: 0 
      }, { status: 200 });
    }

    const data = await response.json();
    
    // Transform backend response to match frontend interface
    return NextResponse.json({
      connected: data.connected > 0,
      judgeCount: data.connected
    });
  } catch (error) {
    console.error('Error fetching judge status:', error);
    return NextResponse.json({ 
      connected: false, 
      judgeCount: 0 
    }, { status: 200 });
  }
}
