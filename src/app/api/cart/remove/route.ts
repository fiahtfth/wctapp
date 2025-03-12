import { NextRequest, NextResponse } from 'next/server';
import { removeQuestionFromCart } from '@/lib/client-actions';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { questionId, testId } = body;
    if (!questionId || !testId) {
      return NextResponse.json({ error: 'Question ID and Test ID are required' }, { status: 400 });
    }
    // Remove question from cart
    const result = await removeQuestionFromCart(questionId, testId);
    return NextResponse.json(
      {
        success: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing question from cart:', error);
    return NextResponse.json({ error: 'Failed to remove question from cart' }, { status: 500 });
  }
}
