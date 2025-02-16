import { NextRequest, NextResponse } from 'next/server';
import { updateQuestion } from '@/lib/database/queries';
import { Question } from '@/lib/types';

export async function PUT(request: NextRequest) {
    try {
        // Parse the request body
        const question: Question = await request.json();
        console.log('Received question for edit:', question);

        // Validate required fields
        if (!question.id) {
            console.error('Question ID is missing');
            return NextResponse.json(
                { error: 'Question ID is required' }, 
                { status: 400 }
            );
        }

        // Validate core question content
        if (!question.Question || !question.Answer) {
            console.error('Question or Answer is missing');
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
        const validQuestionTypes = [
            'Objective', 
            'Subjective', 
            'MCQ', 
            'True/False', 
            'Fill in the Blank'
        ];
        if (question['Question Type'] && !validQuestionTypes.includes(question['Question Type'])) {
            validationErrors.push('Invalid Question Type');
        }

        // Validate Nature of Question
        const validNatureOfQuestions = ['Factual', 'Conceptual', 'Analytical'];
        if (question['Nature of Question'] && !validNatureOfQuestions.includes(question['Nature of Question'])) {
            validationErrors.push('Invalid Nature of Question');
        }

        // If there are validation errors, return them
        if (validationErrors.length > 0) {
            console.error('Validation errors:', validationErrors);
            return NextResponse.json(
                { 
                    error: 'Validation failed', 
                    details: validationErrors 
                }, 
                { status: 400 }
            );
        }

        // Update the question
        console.log('Attempting to update question in database');
        const updatedQuestion = await updateQuestion(question);
        console.log('Question updated successfully:', updatedQuestion);

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
