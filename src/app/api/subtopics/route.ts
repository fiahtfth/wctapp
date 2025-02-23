import { NextResponse } from 'next/server';
import hierarchicalData from '@/lib/database/hierarchicalData';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject');
        const topic = searchParams.get('topic');

        if (!subject || !topic) {
            return NextResponse.json(
                { error: 'Both subject and topic parameters are required' },
                { status: 400 }
            );
        }

        // Find the subject in hierarchicalData
        const subjectData = hierarchicalData.find(s => s.name === subject);
        if (!subjectData) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        // Find all subtopics for the given topic across all modules
        const subtopics = subjectData.modules
            .flatMap(module => 
                module.topics
                    .filter(t => t.name === topic)
                    .flatMap(t => t.subtopics)
            )
            .map(subtopic => subtopic.name);

        // Remove duplicates
        const uniqueSubtopics = [...new Set(subtopics)];

        return NextResponse.json(uniqueSubtopics);
    } catch (error) {
        console.error('Error in /api/subtopics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
