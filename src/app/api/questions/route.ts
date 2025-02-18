import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, addQuestion } from '@/lib/database/queries';
import { Question } from '@/types/question';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Convert and validate pagination parameters
        let page = 1;
        let pageSize = 10;
        
        try {
            const pageParam = searchParams.get('page');
            if (pageParam) {
                page = Math.max(1, parseInt(pageParam, 10));
            }
            
            const pageSizeParam = searchParams.get('pageSize');
            if (pageSizeParam) {
                pageSize = Math.max(1, parseInt(pageSizeParam, 10));
            }
        } catch (e) {
            console.error('Error parsing pagination parameters:', e);
        }
        
        // Prepare filters object with pagination and other filters
        const filters: {
            page: number;
            pageSize: number;
            subject?: string[];
            module?: string[];
            topic?: string[];
            sub_topic?: string[];
            question_type?: string[];
            search?: string;
        } = { page, pageSize };

        // Add other filters if they exist
        const subject = searchParams.get('subject');
        if (subject) filters.subject = subject.split(',');

        const module = searchParams.get('module');
        if (module) filters.module = module.split(',');

        const topic = searchParams.get('topic');
        if (topic) filters.topic = topic.split(',');

        const subTopic = searchParams.get('sub_topic');
        if (subTopic) filters.sub_topic = subTopic.split(',');

        const questionType = searchParams.get('question_type');
        if (questionType) filters.question_type = questionType.split(',');

        const search = searchParams.get('search');
        if (search) filters.search = search;

        console.log('API Route - Received URL search params:', Object.fromEntries(searchParams));
        console.log('API Route - Processed filters:', filters);

        const result = await getQuestions(filters);
        
        // Ensure consistent response structure matching test expectations
        return NextResponse.json({
            questions: result.questions || [],
            total: result.total || 0,
            page: page,
            pageSize: pageSize
        });
    } catch (error) {
        console.error('API Route - Full Error:', error);
        return NextResponse.json({
            questions: [],
            total: 0,
            page: 1,
            pageSize: 10
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Validate input
        const requiredFields = ['Question', 'Answer', 'Subject', 'Question_Type'];
        const missingFields = requiredFields.filter(field => !body[field]);

        if (missingFields.length > 0) {
            return NextResponse.json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            }, { status: 400 });
        }

        // Sanitize and prepare question data
        const questionData: Question = {
            Question: body.Question.trim(),
            Answer: body.Answer.trim(),
            Explanation: body.Explanation ? body.Explanation.trim() : null,
            Subject: body.Subject,
            'Module Number': body['Module Number'] || '',
            'Module Name': body['Module Name'] || '',
            Topic: body.Topic || '',
            'Sub Topic': body['Sub Topic'] || null,
            'Micro Topic': body['Micro Topic'] || null,
            'Faculty Approved': body['Faculty Approved'] || false,
            'Difficulty Level': body['Difficulty Level'] || null,
            'Nature of Question': body['Nature of Question'] || null,
            Objective: body.Objective || '',
            Question_Type: body.Question_Type
        };

        // Add question to database
        const result = await addQuestion(questionData);

        return NextResponse.json({
            message: 'Question added successfully',
            questionId: result.id
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding question:', error);
        return NextResponse.json({
            error: 'Failed to add question',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
