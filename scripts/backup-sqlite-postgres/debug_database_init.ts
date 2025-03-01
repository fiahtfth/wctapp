import * as dbAdapter from '../src/lib/database/adapter';

interface Question {
  id: number;
  Question: string;
  Subject: string;
}

interface QueryResult<T> {
  rows: T[];
}

async function debugDatabaseInit() {
  try {
    console.log('🔍 Debugging Database Initialization');

    // Check total number of questions
    const questionCountQuery = 'SELECT COUNT(*) as count FROM questions';
    const questionCountResult: QueryResult<{count: number}> = await dbAdapter.executeQuery(questionCountQuery);
    const questionCount = questionCountResult.rows[0].count;
    console.log(`📊 Total Questions: ${questionCount}`);

    // Check for sample questions
    const sampleQuestionsQuery = `
      SELECT id, Question, Subject 
      FROM questions 
      WHERE 
        Question LIKE '%Sample Question%' 
        OR Subject = 'Sample Subject'
        OR Question LIKE '%capital of India%'
    `;
    const sampleQuestionsResult: QueryResult<Question> = await dbAdapter.executeQuery(sampleQuestionsQuery);
    
    console.log('🏷️ Sample Questions Found:');
    sampleQuestionsResult.rows.forEach((q: Question, index: number) => {
      console.log(`  Question ${index + 1}:`, {
        id: q.id,
        question: q.Question,
        subject: q.Subject
      });
    });

    // Remove sample questions if found
    if (sampleQuestionsResult.rows.length > 0) {
      const deleteQuery = `
        DELETE FROM questions 
        WHERE 
          Question LIKE '%Sample Question%' 
          OR Subject = 'Sample Subject'
          OR Question LIKE '%capital of India%'
      `;
      const deleteResult = await dbAdapter.executeQuery(deleteQuery);
      console.log('🗑️ Removed Sample Questions:', deleteResult);
    }

    console.log('✅ Database Initialization Debug Complete');
  } catch (error) {
    console.error('❌ Database Initialization Debug Error:', error);
  }
}

debugDatabaseInit();
