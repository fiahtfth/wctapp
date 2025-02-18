import { NextRequest, NextResponse } from 'next/server';
import { updateQuestion } from '@/lib/database/queries';
import { Question } from '@/lib/database/queries';

export async function PUT(request: NextRequest) {
    try {
        // Parse the request body
        const question: Question = await request.json();
        console.log('DETAILED EDIT REQUEST RECEIVED');
        console.log('Full Question Object:', JSON.stringify(question, null, 2));

        // Log request headers for additional context
        console.log('Request Headers:', Object.fromEntries(request.headers));

        // Comprehensive Validation
        const validationErrors: string[] = [];

        // Validate ID
        if (!question.id || question.id <= 0) {
            validationErrors.push('Valid Question ID is required');
        }

        // Validate core question content with length constraints
        if (!question.Question || question.Question.trim().length < 5) {
            validationErrors.push('Question must be at least 5 characters long');
        }
        if (!question.Answer || question.Answer.trim().length < 2) {
            validationErrors.push('Answer must be at least 2 characters long');
        }

        // Optional but recommended fields
        if (!question.Subject || question.Subject.trim().length < 2) {
            validationErrors.push('Subject is required and must be at least 2 characters');
        }
        if (!question.Topic || question.Topic.trim().length < 2) {
            validationErrors.push('Topic is required and must be at least 2 characters');
        }

        // Validate Difficulty Level
        const validDifficultyLevels = ['Easy', 'Medium', 'Hard'];
        if (question['Difficulty Level'] && !validDifficultyLevels.includes(question['Difficulty Level'])) {
            validationErrors.push('Invalid Difficulty Level');
        }

        // Validate Question Type
        const validQuestionTypes = [
            'Objective', 
            'Subjective', 
            'MCQ', 
            'True/False', 
            'Fill in the Blank'
        ];
        if (question['Question_Type'] && !validQuestionTypes.includes(question['Question_Type'])) {
            validationErrors.push('Invalid Question Type');
        }

        // Validate Nature of Question
        const validNatureOfQuestions = ['Factual', 'Conceptual', 'Analytical'];
        if (question['Nature of Question'] && !validNatureOfQuestions.includes(question['Nature of Question'])) {
            validationErrors.push('Invalid Nature of Question');
        }

        // Optional field length validations
        if (question.Explanation && question.Explanation.length > 1000) {
            validationErrors.push('Explanation must be less than 1000 characters');
        }

        // If there are validation errors, return them
        if (validationErrors.length > 0) {
            console.error('EDIT VALIDATION ERRORS:', validationErrors);
            return NextResponse.json(
                { 
                    error: 'Validation failed', 
                    details: validationErrors 
                }, 
                { status: 400 }
            );
        }

        // Update the question in the database
        const updatedQuestion = await updateQuestion(question);

        console.log('Successfully updated question:', updatedQuestion);

        // Return the updated question directly
        return NextResponse.json(updatedQuestion, { status: 200 });
    } catch (error) {
        console.error('CRITICAL EDIT ERROR:', error);
        return NextResponse.json(
            { 
                error: 'Failed to update question', 
                details: error instanceof Error ? error.message : 'Unknown error' 
            }, 
            { status: 500 }
        );
    }
}
