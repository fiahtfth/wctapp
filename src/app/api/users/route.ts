import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('GET /api/users - Forwarding to /api/users/list');
  
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    // Create headers for the forwarded request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Forward the request to the list endpoint
    const response = await fetch(new URL('/api/users/list', request.url).toString(), {
      method: 'GET',
      headers,
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error forwarding request to /api/users/list:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process users request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 