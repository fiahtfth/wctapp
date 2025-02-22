import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    
    try {
      // Attempt to access file metadata first
      await fs.access(faviconPath);
    } catch (accessError) {
      console.error('Favicon file access error:', accessError);
      return new NextResponse(null, { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    try {
      // Read favicon file
      const faviconBuffer = await fs.readFile(faviconPath);

      // Validate buffer
      if (!faviconBuffer || faviconBuffer.length === 0) {
        console.error('Favicon file is empty');
        return new NextResponse(null, { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Return favicon with proper headers
      return new NextResponse(faviconBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=86400'
        }
      });

    } catch (readError) {
      console.error('Error reading favicon file:', readError);
      return new NextResponse(null, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  } catch (error) {
    console.error('Unexpected favicon route error:', error);
    return new NextResponse(null, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
