import { NextRequest, NextResponse } from 'next/server';
import { addQuestionToCart, getCartQuestions } from '@/lib/database/queries';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        // Get the request body
        const body = await request.json();
        const { questionId } = body;

        // Generate a test ID if not provided
        const testId = uuidv4();

        // Add question to cart
        const result = await addQuestionToCart(questionId, testId);

        return NextResponse.json({ 
            success: result, 
            testId 
        }, { status: 200 });
    } catch (error) {
        console.error('Error adding question to cart:', error);
        return NextResponse.json(
            { error: 'Failed to add question to cart' }, 
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
            return NextResponse.json(
                { error: 'Test ID is required' }, 
                { status: 400 }
            );
        }

        // Retrieve cart questions
        const cartQuestions = await getCartQuestions(testId);

        // If no questions in cart, return a specific response
        if (cartQuestions.length === 0) {
            console.log(`No questions found in cart for test ID: ${testId}`);
            return NextResponse.json(
                { 
                    message: 'No questions in cart', 
                    data: [] 
                }, 
                { status: 200 }
            );
        }

        console.log(`Retrieved ${cartQuestions.length} cart questions for test ID: ${testId}`);

        return NextResponse.json(cartQuestions, { status: 200 });
    } catch (error) {
        console.error('Full error in GET /api/cart:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'No stack trace'
        });

        return NextResponse.json(
            { 
                error: 'Failed to retrieve cart questions', 
                details: error instanceof Error ? error.message : 'Unknown error' 
            }, 
            { status: 500 }
        );
    }
}
