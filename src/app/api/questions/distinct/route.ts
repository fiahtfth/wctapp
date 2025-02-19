import { NextRequest, NextResponse } from 'next/server';
import { getDistinctValues } from '@/types/question';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    // Validate input
    const validLevels = ['subject', 'module', 'topic', 'sub_topic', 'question_type'];
    if (!level || !validLevels.includes(level)) {
      return NextResponse.json(
        {
          error: 'Invalid or missing level parameter',
        },
        { status: 400 }
      );
    }

    // Fetch distinct values
    const values = await getDistinctValues(level as any);

    // Filter out null or empty values
    const filteredValues = values.filter(v => v && v.trim() !== '');

    return NextResponse.json(filteredValues);
  } catch (error) {
    console.error('Error fetching distinct values:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch distinct values',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
