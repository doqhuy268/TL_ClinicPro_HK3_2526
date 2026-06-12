import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const backendEndpoint = `${backendUrl}/services/prescription-service/status`;

    console.log('Forwarding update service status request to backend:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'PUT',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Backend service error' }));
      console.error('Backend update service status error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Backend service error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Wrap the response to match the expected frontend structure
    const wrappedResponse = {
      success: true,
      message: 'Service status updated successfully',
      data: data
    };
    
    return NextResponse.json(wrappedResponse);
  } catch (error) {
    console.error('Update service status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
