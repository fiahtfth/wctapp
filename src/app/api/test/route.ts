import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Test API route is working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test API POST route is working',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error parsing request body',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
} 