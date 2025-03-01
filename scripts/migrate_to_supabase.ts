import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Using service role key for full access

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with explicit configuration
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Local SQLite database path
const dbPath = process.env.DATABASE_PATH || '/private/tmp/wct.db';

// Define Question type with optional properties
interface Question {
  id: number;
  text: string;
  answer: string;
  explanation: string;
  subject: string;
  module_name: string;
  topic: string;
  sub_topic: string;
  difficulty_level: string;
  question_type: string;
  nature_of_question: string;
}

// Modify sanitizeQuestion function to match new Supabase schema
function sanitizeQuestion(rawQuestion: any): Question | null {
  try {
    // Validate required fields
    if (!rawQuestion.id || !rawQuestion.Question) {
      console.warn(`Skipping invalid question: ${JSON.stringify(rawQuestion)}`);
      return null;
    }

    // Sanitize and map fields to new schema
    return {
      id: Number(rawQuestion.id),
      text: rawQuestion.Question.trim(),
      answer: rawQuestion.Answer?.trim() || '',
      explanation: rawQuestion.Explanation?.trim() || '',
      subject: rawQuestion.Subject?.trim() || '',
      module_name: rawQuestion["Module Name"]?.trim() || '',
      topic: rawQuestion.Topic?.trim() || '',
      sub_topic: rawQuestion["Sub Topic"]?.trim() || '',
      difficulty_level: rawQuestion["Difficulty Level"]?.trim() || '',
      question_type: rawQuestion.Question_Type?.trim() || '',
      nature_of_question: rawQuestion["Nature of Question"]?.trim() || ''
    };
  } catch (error) {
    console.error(`Error sanitizing question ${rawQuestion.id}:`, error);
    return null;
  }
}

// Function to check Supabase connection and table existence
async function checkSupabaseConnection() {
  try {
    console.log('Checking Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');

    const { data, error } = await supabase
      .from('questions')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase connection or table check failed:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return false;
    }

    console.log('Supabase connection and questions table verified successfully.');
    return true;
  } catch (error) {
    console.error('Unexpected error checking Supabase connection:', error);
    return false;
  }
}

async function migrateQuestions(): Promise<{
  totalQuestions: number;
  migratedQuestions: number;
  failedQuestions: number;
  errorDetails: any[];
}> {
  const errorDetails: any[] = [];
  let migratedQuestions = 0;
  let failedQuestions = 0;

  try {
    // Check Supabase connection before migration
    const connectionOk = await checkSupabaseConnection();
    if (!connectionOk) {
      throw new Error('Supabase connection check failed');
    }

    // Connect to SQLite database
    const db = new Database(dbPath, { readonly: true });

    // Fetch all questions from SQLite
    const questionsQuery = db.prepare(`
      SELECT 
        id, 
        Question, 
        Answer, 
        Explanation, 
        Subject, 
        "Module Name", 
        Topic, 
        "Sub Topic", 
        "Difficulty Level", 
        Question_Type, 
        "Nature of Question"
      FROM questions
    `);

    const rawQuestions = questionsQuery.all();
    console.log(`Found ${rawQuestions.length} questions to migrate`);

    // Sanitize and validate questions
    const sanitizedQuestions = rawQuestions
      .map(sanitizeQuestion)
      .filter((q): q is Question => q !== null);

    console.log(`Sanitized ${sanitizedQuestions.length} questions`);

    // Migrate questions in batches
    const batchSize = 50;
    for (let i = 0; i < sanitizedQuestions.length; i += batchSize) {
      const batch = sanitizedQuestions.slice(i, i + batchSize);
      console.log(`Migrating batch ${Math.floor(i/batchSize) + 1}: ${batch.length} questions`);

      // Upsert batch with comprehensive error handling
      const batchUpsertResults = await Promise.all(
        batch.map(async (question) => {
          try {
            console.log(`Attempting to upsert question ${question.id}`);
            const { data, error } = await supabase
              .from('questions')
              .upsert(question, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });
            
            if (error) {
              console.error(`Detailed Upsert Error for question ${question.id}:`, {
                message: error.message,
                details: error.details,
                code: error.code,
                hint: error.hint,
                questionData: JSON.stringify(question, null, 2)
              });
              
              errorDetails.push({
                questionId: question.id,
                error: {
                  message: error.message,
                  code: error.code,
                  details: error.details,
                  questionData: question
                }
              });
              
              return { success: false, id: question.id };
            }
            
            console.log(`Successfully upserted question ${question.id}`);
            return { success: true, id: question.id };
          } catch (catchError) {
            console.error(`Unexpected error upserting question ${question.id}:`, catchError);
            
            errorDetails.push({
              questionId: question.id,
              error: {
                message: (catchError as Error).message,
                details: catchError,
                questionData: question
              }
            });
            
            return { success: false, id: question.id };
          }
        })
      );

      // Count successful and failed upserts
      const batchSuccesses = batchUpsertResults.filter(r => r.success);
      const batchFailures = batchUpsertResults.filter(r => !r.success);

      migratedQuestions += batchSuccesses.length;
      failedQuestions += batchFailures.length;

      console.log(`Batch ${Math.floor(i/batchSize) + 1} summary:`, {
        total: batch.length,
        successful: batchSuccesses.length,
        failed: batchFailures.length
      });
    }

    // Final migration summary
    console.log(`
Migration Summary:
- Total questions found: ${rawQuestions.length}
- Successfully migrated: ${migratedQuestions}
- Failed migrations: ${failedQuestions}
    `);

    // Log detailed error information
    if (errorDetails.length > 0) {
      console.error('Detailed Migration Errors:');
      errorDetails.forEach((errorDetail, index) => {
        console.error(`Error ${index + 1}:`, JSON.stringify(errorDetail, null, 2));
      });

      // Write errors to a file for further investigation
      const errorLogPath = path.join(process.cwd(), 'migration_errors.json');
      fs.writeFileSync(
        errorLogPath, 
        JSON.stringify(errorDetails, null, 2), 
        'utf8'
      );
      console.log(`Detailed error log written to ${errorLogPath}`);
    }

    return {
      totalQuestions: rawQuestions.length,
      migratedQuestions,
      failedQuestions,
      errorDetails
    };
  } catch (error) {
    console.error('Migration process failed:', error);
    throw error;
  }
}

// Run the migration
migrateQuestions()
  .then(result => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
