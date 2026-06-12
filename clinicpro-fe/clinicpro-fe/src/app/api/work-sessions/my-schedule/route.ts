import { NextRequest, NextResponse } from 'next/server';

// GET /api/work-sessions/my-schedule - Get my work schedule
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = new URLSearchParams();
    if (searchParams.get('startDate')) params.append('startDate', searchParams.get('startDate')!);
    if (searchParams.get('endDate')) params.append('endDate', searchParams.get('endDate')!);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(
      `${backendUrl}/work-sessions/my-schedule?${params.toString()}`,
      {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Backend service error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get my schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
