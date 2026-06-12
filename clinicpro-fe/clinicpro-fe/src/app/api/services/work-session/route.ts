import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the backend service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const backendEndpoint = `${backendUrl}/services/work-session`;

    console.log('Forwarding work session request to backend:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If backend doesn't have work session endpoint yet, return empty response
      if (response.status === 404) {
        console.warn('Work session endpoint not implemented on backend yet');
        const emptyResponse = {
          success: true,
          message: 'Work session endpoint not available',
          data: {
            workSession: null
          }
        };
        return NextResponse.json(emptyResponse);
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Backend service error' }));
      console.error('Backend work session error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Backend service error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Wrap the response to match the expected frontend structure
    const wrappedResponse = {
      success: true,
      message: 'Work session retrieved successfully',
      data: data
    };
    
    return NextResponse.json(wrappedResponse);
  } catch (error) {
    console.error('Work session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
