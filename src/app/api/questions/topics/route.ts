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
    // Get subject from query params
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get('subject');
    
    if (!subject) {
      return NextResponse.json({ 
        error: 'Subject parameter is required', 
        topics: [] 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    debugLog('Getting topics for subject:', subject);
    
    // If we're in Vercel environment and using mock data
    if (isVercelEnvironment() && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      debugLog('Using mock topics for Vercel environment');
      
      // Return mock topics
      const mockTopics = [
        'Sample Topic 1',
        'Sample Topic 2',
        'Sample Topic 3'
      ];
      
      return NextResponse.json({
        topics: mockTopics,
        count: mockTopics.length,
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
    
    // Get distinct topics for the given subject from Supabase
    const { data, error } = await supabase
      .from('questions')
      .select('topic')
      .eq('subject', subject)
      .not('topic', 'is', null)
      .order('topic');
    
    if (error) {
      console.error('Error fetching topics:', error);
      return NextResponse.json({ 
        error: 'Error fetching topics: ' + error.message,
        topics: []
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Extract unique topic names from the result
    const topicSet = new Set<string>();
    data.forEach(item => {
      if (item.topic) {
        topicSet.add(item.topic);
      }
    });
    
    const topicList = Array.from(topicSet).sort();
    
    return NextResponse.json({
      topics: topicList,
      count: topicList.length
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error in topics API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch topics',
      topics: []
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
