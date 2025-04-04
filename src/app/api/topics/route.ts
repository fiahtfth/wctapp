import { NextResponse } from 'next/server';
import hierarchicalData from '@/lib/database/hierarchicalData';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject');
        const moduleName = searchParams.get('module');

        if (!subject) {
            return NextResponse.json({ error: 'Subject parameter is required' }, { status: 400 });
        }

        // Find the subject in hierarchicalData
        const subjectData = hierarchicalData.find(s => s.name === subject);
        if (!subjectData) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        if (moduleName) {
            // If module is specified, return topics for that module
            const moduleData = subjectData.modules.find(m => m.name === moduleName);
            if (!moduleData) {
                return NextResponse.json({ error: 'Module not found' }, { status: 404 });
            }
            return NextResponse.json(moduleData.topics.map(topic => topic.name));
        } else {
            // If no module specified, return modules and their topics
            const moduleTopics = subjectData.modules.map(moduleItem => ({
                module: moduleItem.name,
                topics: moduleItem.topics.map(topic => topic.name)
            }));
            return NextResponse.json(moduleTopics);
        }
    } catch (error) {
        console.error('Error in /api/topics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
