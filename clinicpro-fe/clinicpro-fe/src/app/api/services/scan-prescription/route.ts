import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const backendEndpoint = `${backendUrl}/services/scan-prescription`;

    console.log('Forwarding scan prescription request to backend:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Backend service error' }));
      console.error('Backend scan prescription error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Backend service error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Wrap the response to match the expected frontend structure
    const wrappedResponse = {
      success: true,
      message: 'Prescription scanned successfully',
      data: data
    };
    
    return NextResponse.json(wrappedResponse);
  } catch (error) {
    console.error('Scan prescription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
