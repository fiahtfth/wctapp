import * as dbAdapter from '../src/lib/database/adapter';

interface Question {
  id: number;
  Question: string;
  Subject: string;
  'Module Name': string;
  Topic: string;
}

async function cleanDatabase() {
  try {
    console.log('🧹 Starting Database Cleanup');

    // Remove sample questions
    const removeSampleQuestionsQuery = `
      DELETE FROM questions 
      WHERE 
        Question LIKE '%Sample Question%' 
        OR Subject = 'Sample Subject'
    `;
    const removeResult = await dbAdapter.executeQuery(removeSampleQuestionsQuery);
    console.log('🗑️ Removed Sample Questions:', removeResult);

    // Clear cart items and carts
    await dbAdapter.executeQuery('DELETE FROM cart_items');
    await dbAdapter.executeQuery('DELETE FROM carts');
    console.log('🧼 Cleared Cart Items and Carts');

    // Verify remaining questions
    const questionsQuery = 'SELECT COUNT(*) as count, MIN(id) as min_id, MAX(id) as max_id FROM questions';
    const questionsResult = await dbAdapter.executeQuery(questionsQuery);
    console.log('📊 Questions Remaining:', questionsResult.rows[0]);

    // List first 10 questions
    const listQuestionsQuery = `
      SELECT id, Question, Subject, "Module Name", Topic 
      FROM questions 
      LIMIT 10
    `;
    const questionsListResult = await dbAdapter.executeQuery(listQuestionsQuery);
    console.log('📝 Sample Questions:');
    (questionsListResult.rows as Question[]).forEach((q, index) => {
      console.log(`  Question ${index + 1}:`, {
        id: q.id,
        question: q.Question.substring(0, 100) + '...',
        subject: q.Subject,
        moduleName: q['Module Name'],
        topic: q.Topic
      });
    });

    console.log('✅ Database Cleanup Complete');
  } catch (error) {
    console.error('❌ Database Cleanup Error:', error);
  }
}

cleanDatabase();
