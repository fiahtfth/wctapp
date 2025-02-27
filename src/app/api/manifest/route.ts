import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the manifest.json file in the public directory
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    
    // Read the manifest file
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifestJson = JSON.parse(manifestContent);
    
    // Return the manifest with appropriate headers
    return NextResponse.json(manifestJson, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error serving manifest.json:', error);
    return NextResponse.json(
      { error: 'Failed to serve manifest.json' },
      { status: 500 }
    );
  }
}
