import { NextRequest, NextResponse } from 'next/server';

// GET /api/work-sessions - Get all work sessions (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = new URLSearchParams();
    if (searchParams.get('startDate')) params.append('startDate', searchParams.get('startDate')!);
    if (searchParams.get('endDate')) params.append('endDate', searchParams.get('endDate')!);
    if (searchParams.get('status')) params.append('status', searchParams.get('status')!);
    if (searchParams.get('userType')) params.append('userType', searchParams.get('userType')!);
    if (searchParams.get('limit')) params.append('limit', searchParams.get('limit')!);
    if (searchParams.get('offset')) params.append('offset', searchParams.get('offset')!);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(
      `${backendUrl}/work-sessions?${params.toString()}`,
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
    console.error('Get work sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/work-sessions - Create work sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(
      `${backendUrl}/work-sessions`,
      {
        method: 'POST',
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
    console.error('Create work sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
