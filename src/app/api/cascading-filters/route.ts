import { NextRequest, NextResponse } from 'next/server';
import { FILTER_MAPPINGS } from '@/lib/filterMappings';
import hierarchicalData, { 
  getSubjects, 
  getModules, 
  getTopics, 
  getSubtopics 
} from '@/lib/database/hierarchicalData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const level = searchParams.get('level');
  const subject = searchParams.get('subject');
  const moduleParam = searchParams.get('module');
  const topic = searchParams.get('topic');
  
  console.log('Cascading filters request:', { level, subject, moduleParam, topic });
  
  try {
    switch (level) {
      case 'subjects':
        return NextResponse.json(getSubjects());
        
      case 'modules':
        if (subject) {
          return NextResponse.json(getModules(subject));
        }
        return NextResponse.json([]);
        
      case 'topics':
        if (subject && moduleParam) {
          return NextResponse.json(getTopics(subject, moduleParam));
        }
        return NextResponse.json([]);
        
      case 'sub_topics':
        if (subject && moduleParam && topic) {
          return NextResponse.json(getSubtopics(subject, moduleParam, topic));
        } else if (subject && topic) {
          // If module is not provided, we need to find the module that contains this topic
          const subjectData = hierarchicalData.find(s => s.name === subject);
          if (!subjectData) {
            return NextResponse.json([]);
          }
          
          // Look through all modules to find the topic
          for (const moduleItem of subjectData.modules) {
            const topicItem = moduleItem.topics.find(t => t.name === topic);
            if (topicItem) {
              return NextResponse.json(topicItem.subtopics.map(st => st.name));
            }
          }
        }
        return NextResponse.json([]);
        
      case 'question_types':
        // Return a predefined list of question types
        return NextResponse.json([
          'Objective',
          'Subjective',
          'Multiple Choice',
          'Short Answer',
          'Long Answer',
          'Case Study',
          'Numerical',
          'Theoretical',
          'Conceptual',
          'Applied'
        ]);
        
      default:
        return NextResponse.json({ error: 'Invalid level specified' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cascading filters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
