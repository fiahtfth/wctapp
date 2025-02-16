import { NextRequest, NextResponse } from 'next/server';
import { updateQuestion } from '@/lib/database/queries';
import { Question } from '@/lib/types';

export async function PUT(request: NextRequest) {
    try {
        // Parse the request body
        const question: Question = await request.json();

        // Validate required fields
        if (!question.id) {
            return NextResponse.json(
                { error: 'Question ID is required' }, 
                { status: 400 }
            );
        }

        // Validate question content
        if (!question.Question || !question.Answer) {
            return NextResponse.json(
                { error: 'Question and Answer are required' }, 
                { status: 400 }
            );
        }

        // Update the question
        const updatedQuestion = await updateQuestion(question);

        return NextResponse.json(
            { 
                message: 'Question updated successfully', 
                question: updatedQuestion 
            }, 
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in question edit route:', error);
        return NextResponse.json(
            { 
                error: 'Failed to update question', 
                details: error instanceof Error ? error.message : 'Unknown error' 
            }, 
            { status: 500 }
        );
    }
}
