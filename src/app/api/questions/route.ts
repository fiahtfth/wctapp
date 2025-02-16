import { NextRequest, NextResponse } from 'next/server';
import { getQuestions } from '@/lib/database/queries';

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
            return NextResponse.json(
                { 
                    error: 'Invalid pagination parameters',
                    data: [],
                    pagination: {
                        currentPage: page,
                        pageSize: pageSize,
                        totalItems: 0,
                        totalPages: 0
                    }
                },
                { status: 400 }
            );
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
        
        // Ensure consistent response structure
        return NextResponse.json({
            data: result.questions || [],
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalItems: result.total || 0,
                totalPages: Math.ceil((result.total || 0) / pageSize)
            }
        });
    } catch (error) {
        console.error('API Route - Full Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to retrieve questions from database', 
                details: error instanceof Error ? error.message : 'Unknown error',
                data: [],
                pagination: {
                    currentPage: 1,
                    pageSize: 10,
                    totalItems: 0,
                    totalPages: 0
                }
            }, 
            { status: 500 }
        );
    }
}
