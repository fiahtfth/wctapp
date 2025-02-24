import { NextResponse } from 'next/server';
import hierarchicalData from '@/lib/database/hierarchicalData';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject');
        const topic = searchParams.get('topic');
        const subtopic = searchParams.get('subtopic');

        if (!subject || !topic || !subtopic) {
            return NextResponse.json(
                { error: 'Subject, topic, and subtopic parameters are required' },
                { status: 400 }
            );
        }

        // Find the subject in hierarchicalData
        const subjectData = hierarchicalData.find(s => s.name === subject);
        if (!subjectData) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        // Find all microtopics for the given subtopic across all modules
        const microtopics = subjectData.modules
            .flatMap(module => 
                module.topics
                    .filter(t => t.name === topic)
                    .flatMap(t => 
                        t.subtopics
                            .filter(st => st.name === subtopic)
                            .flatMap(st => st.microtopics || [])
                    )
            );

        // Remove duplicates
        const uniqueMicrotopics = [...new Set(microtopics)];

        return NextResponse.json(uniqueMicrotopics);
    } catch (error) {
        console.error('Error in /api/microtopics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
