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

        // Validate core question content
        if (!question.Question || !question.Answer) {
            return NextResponse.json(
                { error: 'Question and Answer are required' }, 
                { status: 400 }
            );
        }

        // Validate additional metadata (optional)
        const validationErrors: string[] = [];

        // Check Subject and Topic
        if (!question.Subject) validationErrors.push('Subject is required');
        if (!question.Topic) validationErrors.push('Topic is required');

        // Validate Difficulty Level
        const validDifficultyLevels = ['Easy', 'Medium', 'Hard'];
        if (question['Difficulty Level'] && !validDifficultyLevels.includes(question['Difficulty Level'])) {
            validationErrors.push('Invalid Difficulty Level');
        }

        // Validate Question Type
        const validQuestionTypes = ['MCQ', 'Subjective', 'True/False', 'Fill in the Blank'];
        if (question['Nature of Question'] && !validQuestionTypes.includes(question['Nature of Question'])) {
            validationErrors.push('Invalid Question Type');
        }

        // If there are validation errors, return them
        if (validationErrors.length > 0) {
            return NextResponse.json(
                { 
                    error: 'Validation failed', 
                    details: validationErrors 
                }, 
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
