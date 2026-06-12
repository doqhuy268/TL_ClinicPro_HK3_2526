import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    // segments: ["src","app","api",...,"prescription-service","{id}","complete"] when built
    const prescriptionServiceId = segments[segments.length - 2];

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(
      `${backendUrl}/services/prescription-service/${prescriptionServiceId}/complete`,
      {
        method: 'POST',
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
    console.error('Complete service error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
