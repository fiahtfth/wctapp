import Database from "better-sqlite3";
import path from "path";

// Define the Question type
interface Question {
  id?: number;
  Question: string;
  Answer: string;
  Explanation?: string | null;
  Subject: string;
  "Module Number": string;
  "Module Name": string;
  Topic: string;
  "Sub Topic"?: string | null;
  "Micro Topic"?: string | null;
  "Faculty Approved": boolean;
  "Difficulty Level"?: string | null;
  "Nature of Question"?: string | null;
  Objective?: string;
  Question_Type: string;
}

// Database path
const DB_PATH = path.resolve(process.cwd(), "src/lib/database/wctecm.db");

// Function to create questions table
function createQuestionsTable(db: Database) {
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            "Question" TEXT NOT NULL,
            "Answer" TEXT NOT NULL,
            "Explanation" TEXT,
            "Subject" TEXT NOT NULL,
            "Module Number" TEXT,
            "Module Name" TEXT,
            "Topic" TEXT,
            "Sub Topic" TEXT,
            "Micro Topic" TEXT,
            "Faculty Approved" INTEGER DEFAULT 0,
            "Difficulty Level" TEXT,
            "Nature of Question" TEXT,
            "Objective" TEXT,
            "Question_Type" TEXT NOT NULL,
            "Last Updated" DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;
  db.prepare(createTableQuery).run();
}

// Function to add a question
function addQuestion(question: Question): { id: number } {
  const db = new Database(DB_PATH);

  try {
    // Ensure table exists
    createQuestionsTable(db);

    // Validate required fields
    if (
      !question.Question ||
      !question.Answer ||
      !question.Subject ||
      !question.Question_Type
    ) {
      throw new Error("Missing required fields for question");
    }

    // Convert boolean to number for SQLite compatibility
    const processedQuestion = {
      ...question,
      "Faculty Approved": question["Faculty Approved"] ? 1 : 0,
    };

    // Prepare the SQL insert statement dynamically
    const columns = Object.keys(processedQuestion)
      .filter(
        (key) =>
          processedQuestion[key] !== undefined &&
          processedQuestion[key] !== null,
      )
      .map((key) => `"${key}"`);

    const placeholders = columns.map(() => "?").join(", ");

    const values = columns.map(
      (col) => processedQuestion[col.replace(/"/g, "")],
    );

    const query = `
            INSERT INTO questions (${columns.join(", ")}, "Last Updated")
            VALUES (${placeholders}, CURRENT_TIMESTAMP)
            RETURNING id;
        `;

    console.group("Question Insertion Process");
    console.log("Prepared SQL query:", query);
    console.log("Columns:", columns);
    console.log("Values:", values);

    const stmt = db.prepare(query);
    const result = stmt.get(...values);

    if (!result || !result.id) {
      console.error("No ID returned from question insertion");
      throw new Error("Failed to insert question");
    }

    console.log("Successfully inserted question with ID:", result.id);
    console.groupEnd();

    return { id: result.id };
  } catch (error) {
    console.error("Error in addQuestion:", error);
    throw error;
  } finally {
    db.close();
  }
}

function testQuestionSubmission() {
  console.log("🧪 Starting Question Submission Test 🧪");

  // Test case 1: Complete question submission
  try {
    const completeQuestion: Question = {
      Question: "What is the capital of France?",
      Answer: "Paris",
      Subject: "Geography",
      "Module Name": "World Capitals",
      Topic: "European Capitals",
      Question_Type: "Multiple Choice",
      "Module Number": "1",
      "Faculty Approved": true,
      "Difficulty Level": "Easy",
      Explanation: "Paris is the capital and largest city of France.",
      Objective: "Test geographical knowledge",
      "Nature of Question": "Factual",
      "Sub Topic": "European Geography",
      "Micro Topic": "Capital Cities",
    };

    console.log("Attempting to submit complete question...");
    const result = addQuestion(completeQuestion);
    console.log("✅ Complete Question Submitted Successfully! ID:", result.id);

    // Test case 2: Minimal required fields
    const minimalQuestion: Question = {
      Question: "What is 2 + 2?",
      Answer: "4",
      Subject: "Mathematics",
      Question_Type: "Calculation",
    };

    console.log("Attempting to submit minimal question...");
    const minimalResult = addQuestion(minimalQuestion);
    console.log(
      "✅ Minimal Question Submitted Successfully! ID:",
      minimalResult.id,
    );

    // Test case 3: Missing required fields
    try {
      const incompleteQuestion: Partial<Question> = {
        Question: "Incomplete question",
        Subject: "Test Subject",
      };

      console.log("Attempting to submit incomplete question...");
      // @ts-ignore - intentionally passing incomplete data
      addQuestion(incompleteQuestion);
      console.error("❌ Error: Incomplete question should not be submitted");
    } catch (error) {
      console.log("✅ Correctly prevented submission of incomplete question");
      console.log("Error:", (error as Error).message);
    }

    console.log("🎉 All Question Submission Tests Completed Successfully! 🎉");
  } catch (error) {
    console.error("❌ Test Failed:", error);
  }
}

// Run the test
testQuestionSubmission();
