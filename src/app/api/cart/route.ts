import { NextRequest, NextResponse } from 'next/server';
import { addQuestionToCart, getCartQuestions } from '@/types/question';
import { v4 as uuidv4 } from 'uuid';
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { questionId, testId } = body;
    // Validate input
    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    // Generate a test ID if not provided
    const finalTestId = testId || uuidv4();
    // Add question to cart
    const result = await addQuestionToCart(questionId, finalTestId);
    return NextResponse.json(
      {
        success: result,
        testId: finalTestId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adding question to cart:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add question to cart',
      },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    // Extract test ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const testId = searchParams.get('testId');
    console.log('Received cart request with testId:', testId);
    if (!testId) {
      console.error('GET /api/cart: No test ID provided');
      return NextResponse.json({ error: 'Test ID is required', questions: [] }, { status: 400 });
    }
    // Retrieve cart questions
    const cartQuestions = await getCartQuestions(testId);
    // Always return a valid response
    return NextResponse.json(
      {
        questions: cartQuestions,
        count: cartQuestions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving cart questions:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retrieve cart questions',
        questions: [],
      },
      { status: 500 }
    );
  }
}
