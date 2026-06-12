import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const workSessionId = searchParams.get('workSessionId');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    // Build query parameters for backend
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (workSessionId) queryParams.append('workSessionId', workSessionId);
    if (limit) queryParams.append('limit', limit);
    if (offset) queryParams.append('offset', offset);

    const queryString = queryParams.toString();
    
    // Forward the request to the backend service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const backendEndpoint = queryString 
      ? `${backendUrl}/services/my-services?${queryString}`
      : `${backendUrl}/services/my-services`;

    console.log('Forwarding request to backend:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Backend service error' }));
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Backend service error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend response data:', data);
    
    // Wrap the response to match the expected frontend structure
    const wrappedResponse = {
      success: true,
      message: 'Services retrieved successfully',
      data: data
    };
    
    console.log('Wrapped response:', wrappedResponse);
    return NextResponse.json(wrappedResponse);
  } catch (error) {
    console.error('Get my services error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
