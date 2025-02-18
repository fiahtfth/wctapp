import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const db = new Database('./src/lib/database/questions.db');

export async function PUT(request: NextRequest) {
    try {
        console.group('QUESTION EDIT API ROUTE');
        console.log('1. Request Received');

        // Parse and validate the request body
        const body = await request.json();
        const question = body;
        
        console.log('2. Full Question Object:', JSON.stringify(question, null, 2));

        // Ensure id is present and valid
        if (!question.id || typeof question.id !== 'number' || question.id <= 0) {
            console.error('3. Invalid question ID');
            console.groupEnd();
            return new NextResponse(
                JSON.stringify({ error: 'Invalid question ID' }),
                { status: 400 }
            );
        }

        // Log request headers for additional context
        console.log('4. Request Headers:', Object.fromEntries(request.headers));

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
            console.error('5. EDIT VALIDATION ERRORS:', validationErrors);
            console.groupEnd();
            return NextResponse.json(
                { 
                    error: 'Validation failed', 
                    details: validationErrors 
                }, 
                { status: 400 }
            );
        }

        // Prepare update statement
        const stmt = db.prepare(`
            UPDATE questions 
            SET 
                Question = ?, 
                Answer = ?, 
                Subject = ?, 
                Topic = ?, 
                'Difficulty Level' = ?, 
                'Question_Type' = ?, 
                'Nature of Question' = ?, 
                'Faculty Approved' = ?,
                Explanation = ?,
                'Sub Topic' = ?,
                'Micro Topic' = ?,
                'Module Name' = ?,
                'Module Number' = ?
            WHERE id = ?
        `);

        // Execute update
        const result = stmt.run(
            question.Question,
            question.Answer,
            question.Subject,
            question.Topic,
            question['Difficulty Level'],
            question['Question_Type'],
            question['Nature of Question'],
            question['Faculty Approved'] ? 1 : 0,
            question.Explanation || '',
            question['Sub Topic'] || '',
            question['Micro Topic'] || '',
            question['Module Name'] || '',
            question['Module Number'] || '',
            question.id
        );

        console.log('6. Database Update Result:', {
            changes: result.changes,
            lastInsertRowid: result.lastInsertRowid
        });

        // Fetch the updated question to return
        const updatedQuestionStmt = db.prepare('SELECT * FROM questions WHERE id = ?');
        const updatedQuestion = updatedQuestionStmt.get(question.id);

        console.log('7. Updated Question:', JSON.stringify(updatedQuestion, null, 2));
        console.groupEnd();

        return NextResponse.json(updatedQuestion, { status: 200 });
    } catch (error) {
        console.error('8. EDIT ROUTE ERROR:', error);
        console.groupEnd();
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message }, 
            { status: 500 }
        );
    }
}
