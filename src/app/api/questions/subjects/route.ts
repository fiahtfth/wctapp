import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/database/supabaseClient';

// Function to enable debug logging
function debugLog(...args: any[]): void {
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}

// Function to check if we're in Vercel environment
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || !!process.env.VERCEL;
}

export async function GET(request: NextRequest) {
  try {
    debugLog('Getting all subjects');
    
    // If we're in Vercel environment and using mock data
    if (isVercelEnvironment() && process.env.USE_MOCK_DATA === 'true') {
      debugLog('Using mock subjects for Vercel environment');
      
      // Return mock subjects
      const mockSubjects = [
        'Sample Subject 1',
        'Sample Subject 2',
        'Sample Subject 3'
      ];
      
      return NextResponse.json({
        subjects: mockSubjects,
        count: mockSubjects.length,
        vercelMode: true
      }, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Get distinct subjects from Supabase
    const { data, error } = await supabase
      .from('questions')
      .select('subject')
      .not('subject', 'is', null)
      .order('subject');
    
    if (error) {
      console.error('Error fetching subjects:', error);
      return NextResponse.json({ 
        error: 'Error fetching subjects: ' + error.message,
        subjects: []
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Extract unique subject names from the result
    const subjectSet = new Set<string>();
    data.forEach(item => {
      if (item.subject) {
        subjectSet.add(item.subject);
      }
    });
    
    const subjectList = Array.from(subjectSet).sort();
    
    return NextResponse.json({
      subjects: subjectList,
      count: subjectList.length
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error in subjects API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch subjects',
      subjects: []
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}
