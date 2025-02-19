"use server";

import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcrypt";

const DB_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "database",
  "questions.db",
);

// Define type for database query results
type TotalResult = { total: number };
type QuestionResult = {
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
  [key: string]: string | number | boolean | null | undefined;
};

function isQuestionResult(q: unknown): q is QuestionResult {
  return (
    q !== null &&
    typeof q === "object" &&
    "Question" in q &&
    "Answer" in q &&
    "Explanation" in q
  );
}

export async function getQuestions(filters: {
  page?: number;
  pageSize?: number;
  subject?: string | string[];
  module?: string | string[];
  topic?: string | string[];
  sub_topic?: string | string[];
  question_type?: string | string[];
  search?: string;
}) {
  const db = await openDatabase();

  try {
    console.log("getQuestions - Received filters:", filters);

    // Validate and normalize filters
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const offset = (page - 1) * pageSize;

    // Construct base query
    let query = "SELECT * FROM questions WHERE 1=1";
    const queryParams: any[] = [];

    // Dynamic filter conditions
    const conditions: string[] = [];

    // Subject filter
    if (filters.subject) {
      const subjects = Array.isArray(filters.subject)
        ? filters.subject
        : [filters.subject];
      conditions.push(`"Subject" IN (${subjects.map(() => "?").join(",")})`);
      queryParams.push(...subjects);
    }

    // Module filter
    if (filters.module) {
      const modules = Array.isArray(filters.module)
        ? filters.module
        : [filters.module];
      conditions.push(`"Module Name" IN (${modules.map(() => "?").join(",")})`);
      queryParams.push(...modules);
    }

    // Topic filter
    if (filters.topic) {
      const topics = Array.isArray(filters.topic)
        ? filters.topic
        : [filters.topic];
      conditions.push(`"Topic" IN (${topics.map(() => "?").join(",")})`);
      queryParams.push(...topics);
    }

    // Sub Topic filter
    if (filters.sub_topic) {
      const subTopics = Array.isArray(filters.sub_topic)
        ? filters.sub_topic
        : [filters.sub_topic];
      conditions.push(`"Sub Topic" IN (${subTopics.map(() => "?").join(",")})`);
      queryParams.push(...subTopics);
    }

    // Question Type filter
    if (filters.question_type) {
      const questionTypes = Array.isArray(filters.question_type)
        ? filters.question_type
        : [filters.question_type];
      conditions.push(
        `"Question_Type" IN (${questionTypes.map(() => "?").join(",")})`,
      );
      queryParams.push(...questionTypes);
    }

    // Search filter
    if (filters.search) {
      conditions.push(
        `("Question" LIKE ? OR "Answer" LIKE ? OR "Explanation" LIKE ?)`,
      );
      const searchTerm = `%${filters.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Combine conditions
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    // Add pagination
    query += " LIMIT ? OFFSET ?";
    queryParams.push(pageSize, offset);

    // Count total matching records
    let countQuery = "SELECT COUNT(*) as total FROM questions WHERE 1=1";
    if (conditions.length > 0) {
      countQuery += " AND " + conditions.join(" AND ");
    }

    console.log("Executing query:", query);
    console.log("Query parameters:", queryParams);

    // Execute queries
    const questionsStmt = db.prepare(query);
    const countStmt = db.prepare(countQuery);

    const questions = questionsStmt.all(...queryParams);
    const totalResult = countStmt.get(
      ...(conditions.length > 0 ? queryParams.slice(0, -2) : []),
    );

    console.log("Fetched questions:", questions);
    console.log("Total count:", totalResult);

    return {
      questions: questions || [],
      total: totalResult?.total || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Error in getQuestions:", error);
    console.error("Error details:", error.message, error.stack);
    throw error;
  } finally {
    db.close();
  }
}

// Define the structure for our hierarchical data
interface SubTopic {
  name: string;
}

interface Topic {
  name: string;
  subTopics?: SubTopic[];
}

interface Module {
  name: string;
  topics: Topic[];
}

interface Subject {
  name: string;
  modules: Module[];
}

// Predefined hierarchical structure for subjects, modules, and topics
const hierarchicalData: Subject[] = [
  {
    name: "Geography",
    modules: [
      {
        name: "Physical Geography",
        topics: [
          { name: "Geomorphology" },
          { name: "Climatology" },
          { name: "Oceanography" },
          { name: "Biogeography" },
        ],
      },
      {
        name: "Human Geography",
        topics: [
          { name: "Population" },
          { name: "Settlements" },
          { name: "Economic Activities" },
        ],
      },
    ],
  },
  {
    name: "Ecology and Environment",
    modules: [
      {
        name: "Ecosystems",
        topics: [
          { name: "Types of Ecosystems" },
          { name: "Biodiversity" },
          { name: "Conservation" },
        ],
      },
      {
        name: "Environmental Issues",
        topics: [
          { name: "Climate Change" },
          { name: "Pollution" },
          { name: "Sustainable Development" },
        ],
      },
    ],
  },
  {
    name: "Economics",
    modules: [
      {
        name: "Microeconomics",
        topics: [
          { name: "Demand and Supply" },
          { name: "Market Structures" },
          { name: "Factor Markets" },
        ],
      },
      {
        name: "Macroeconomics",
        topics: [
          { name: "National Income" },
          { name: "Money and Banking" },
          { name: "International Trade" },
        ],
      },
    ],
  },
  {
    name: "History",
    modules: [
      {
        name: "Ancient History",
        topics: [
          { name: "Indus Valley Civilization" },
          { name: "Vedic Period" },
          { name: "Mauryan Empire" },
        ],
      },
      {
        name: "Medieval History",
        topics: [
          { name: "Delhi Sultanate" },
          { name: "Mughal Empire" },
          { name: "Vijayanagar Empire" },
        ],
      },
      {
        name: "Modern History",
        topics: [
          { name: "British Rule" },
          { name: "Indian Independence Movement" },
          { name: "Post-Independence India" },
        ],
      },
    ],
  },
  {
    name: "Polity and Governance",
    modules: [
      {
        name: "Indian Constitution",
        topics: [
          { name: "Fundamental Rights" },
          { name: "Directive Principles" },
          { name: "Constitutional Bodies" },
        ],
      },
      {
        name: "Government Structure",
        topics: [
          { name: "Executive" },
          { name: "Legislature" },
          { name: "Judiciary" },
        ],
      },
    ],
  },
  {
    name: "Science and Technology",
    modules: [
      {
        name: "Physics",
        topics: [
          { name: "Mechanics" },
          { name: "Electricity and Magnetism" },
          { name: "Modern Physics" },
        ],
      },
      {
        name: "Chemistry",
        topics: [
          { name: "Organic Chemistry" },
          { name: "Inorganic Chemistry" },
          { name: "Physical Chemistry" },
        ],
      },
      {
        name: "Biology",
        topics: [
          { name: "Cell Biology" },
          { name: "Genetics" },
          { name: "Evolution" },
        ],
      },
    ],
  },
];

// Predefined subjects
const predefinedSubjects = [
  "Economics",
  "Polity and Governance",
  "World Geography",
  "Science and Technology",
];

type CascadingLevel =
  | "modules"
  | "topics"
  | "sub_topics"
  | "question_types"
  | "subjects";

// Predefined hierarchical structure for subjects, modules, and topics
const getSubjects = () => hierarchicalData.map((subject) => subject.name);

const getModules = (subject?: string | string[]): string[] => {
  // Normalize subject to an array
  const subjects = Array.isArray(subject) ? subject : [subject].filter(Boolean);

  const allModules = subjects.flatMap((subjectName) => {
    const subjectData = hierarchicalData.find((s) => s.name === subjectName);
    return subjectData ? subjectData.modules.map((module) => module.name) : [];
  });

  // Remove duplicates using Array.from and Set
  return Array.from(new Set(allModules));
};

const getTopics = (
  subject?: string | string[],
  module?: string | string[],
): string[] => {
  if (!subject || !module) return [];

  // Normalize subject and module to arrays
  const subjects = Array.isArray(subject) ? subject : [subject].filter(Boolean);
  const modules = Array.isArray(module) ? module : [module].filter(Boolean);

  // Collect topics from all specified subject-module combinations
  const allTopics = subjects.flatMap((subjectName) =>
    modules.flatMap((moduleName) => {
      const subjectData = hierarchicalData.find((s) => s.name === subjectName);
      if (!subjectData) return [];

      const moduleData = subjectData.modules.find((m) => m.name === moduleName);
      return moduleData ? moduleData.topics.map((topic) => topic.name) : [];
    }),
  );

  // Remove duplicates using Array.from and Set
  return Array.from(new Set(allTopics));
};

export async function getCascadingOptions(
  level: CascadingLevel,
  filters?: Record<string, string | string[]>,
): Promise<string[]> {
  // Handle predefined hierarchical data
  if (level === "subjects") {
    return predefinedSubjects;
  }

  if (level === "modules" && filters?.subject) {
    const subjects = Array.isArray(filters.subject)
      ? filters.subject
      : [filters.subject];
    return getModules(subjects);
  }

  if (level === "topics" && filters?.subject && filters?.module) {
    const subjects = Array.isArray(filters.subject)
      ? filters.subject
      : [filters.subject];
    const modules = Array.isArray(filters.module)
      ? filters.module
      : [filters.module];
    return getTopics(subjects, modules);
  }

  // For question_types and sub_topics, we'll still use the database
  const db = await openDatabase();

  try {
    // Mapping of levels to their corresponding database columns and parent columns
    const levelMap: {
      [key: string]: {
        column: string;
        parentFilters?: string[];
      };
    } = {
      subjects: {
        column: "Subject",
      },
      modules: {
        column: "Module Name",
        parentFilters: ["Subject"],
      },
      topics: {
        column: "Topic",
        parentFilters: ["Subject", "Module Name"],
      },
      sub_topics: {
        column: "Sub Topic",
        parentFilters: ["Subject", "Module Name", "Topic"],
      },
      question_types: {
        column: "Question_Type",
      },
    };

    // Validate the level
    const levelConfig = levelMap[level];
    if (!levelConfig) {
      throw new Error(`Invalid cascading level: ${level}`);
    }

    // Prepare query components
    const whereConditions: string[] = [];
    const params: any[] = [];

    // Add parent filter conditions if applicable
    if (levelConfig.parentFilters && filters) {
      levelConfig.parentFilters.forEach((parentColumn) => {
        const parentFilterValues =
          filters[parentColumn.toLowerCase().replace(" ", "_")];
        if (parentFilterValues) {
          const normalizedValues = Array.isArray(parentFilterValues)
            ? parentFilterValues
            : [parentFilterValues];

          whereConditions.push(
            `'${parentColumn}' IN (${normalizedValues.map(() => "?").join(",")})`,
          );
          params.push(...normalizedValues);
        }
      });
    }

    // Add any additional filters passed
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        // Skip parent filters we've already handled
        if (
          levelConfig.parentFilters
            ?.map((p) => p.toLowerCase().replace(" ", "_"))
            .includes(key)
        ) {
          return;
        }

        const normalizedValues = Array.isArray(value)
          ? value.filter((v) => v && v.trim() !== "")
          : typeof value === "string"
            ? value.split(",").filter((v) => v.trim() !== "")
            : [];

        if (normalizedValues.length > 0) {
          const placeholders = normalizedValues.map(() => "?").join(",");
          whereConditions.push(`'${key}' IN (${placeholders})`);
          params.push(...normalizedValues);
        }
      });
    }

    // Construct the full query
    const query = `
            SELECT DISTINCT '${levelConfig.column}' 
            FROM questions 
            WHERE '${levelConfig.column}' IS NOT NULL AND '${levelConfig.column}' != ''
            ${whereConditions.length > 0 ? "AND " + whereConditions.join(" AND ") : ""} 
            ORDER BY '${levelConfig.column}'
        `;

    console.log("Cascading Options Query:", query);
    console.log("Query Params:", params);

    const stmt = db.prepare(query);
    const results = (await stmt.all(params)) as Array<Record<string, string>>;

    const options = results
      .map((result) => result[levelConfig.column] as string)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)); // Alphabetical sorting

    console.log(`Options for ${level}:`, options);
    return options;
  } catch (error) {
    console.error(`Error fetching cascading options for ${level}:`, error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function getDistinctValues(
  level: "subject" | "module" | "topic" | "sub_topic" | "question_type",
): Promise<string[]> {
  const db = await openDatabase();

  try {
    let query = "";
    switch (level) {
      case "subject":
        query = "SELECT DISTINCT Subject FROM questions ORDER BY Subject";
        break;
      case "module":
        query =
          'SELECT DISTINCT "Module Name" FROM questions ORDER BY "Module Name"';
        break;
      case "topic":
        query = "SELECT DISTINCT Topic FROM questions ORDER BY Topic";
        break;
      case "sub_topic":
        query =
          'SELECT DISTINCT "Sub Topic" FROM questions WHERE "Sub Topic" IS NOT NULL ORDER BY "Sub Topic"';
        break;
      case "question_type":
        query =
          'SELECT DISTINCT "Question_Type" FROM questions ORDER BY "Question_Type"';
        break;
      default:
        throw new Error(`Unsupported level: ${level}`);
    }

    const results = db.prepare(query).all() as { [key: string]: string }[];

    // Extract the values, defaulting to an empty array if no results
    return results
      .map((result) => Object.values(result)[0])
      .filter((value) => value !== null && value !== undefined);
  } catch (error) {
    console.error(`Error getting distinct values for ${level}:`, error);
    return [];
  } finally {
    await db.close();
  }
}

export async function migrateQuestionsTable() {
  const db = await openDatabase();

  try {
    // Ensure Question_Type column exists
    const tableInfo = db.prepare("PRAGMA table_info(questions)").all();
    const hasQuestionTypeColumn = tableInfo.some(
      (col: any) => col.name === "question_type",
    );

    if (!hasQuestionTypeColumn) {
      // Add Question_Type column if it doesn't exist
      db.prepare(
        `
                ALTER TABLE questions 
                ADD COLUMN question_type TEXT
            `,
      ).run();
    }

    // Update Question_Type based on Nature_of_Question
    db.prepare(
      `
            UPDATE questions 
            SET question_type = 
                CASE 
                    WHEN nature_of_question = 'Analytical' THEN 'Analytical'
                    WHEN nature_of_question = 'Factual' THEN 'Factual'
                    ELSE 'Other'
                END
        `,
    ).run();

    console.log("Questions table migration completed successfully");
  } catch (error) {
    console.error("Error migrating questions table:", error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function createQuestionsTable() {
  const db = await openDatabase();

  try {
    // Alter table to add Question Type column and drop Objective
    db.prepare(
      `
            BEGIN TRANSACTION;
            
            -- Create a new table with the desired schema
            CREATE TABLE questions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_text TEXT,
                answer TEXT,
                explanation TEXT,
                subject TEXT,
                module_number TEXT,
                module_name TEXT,
                topic TEXT,
                sub_topic TEXT,
                difficulty_level TEXT,
                nature_of_question TEXT,
                question_type TEXT
            );

            -- Copy data from old table to new table
            INSERT INTO questions_new (
                question_text, answer, explanation, subject, 
                module_number, module_name, topic, sub_topic, 
                difficulty_level, nature_of_question, question_type
            ) 
            SELECT 
                question_text, answer, explanation, subject, 
                module_number, module_name, topic, sub_topic, 
                difficulty_level, nature_of_question, Objective
            FROM questions;

            -- Drop the old table
            DROP TABLE questions;

            -- Rename the new table
            ALTER TABLE questions_new RENAME TO questions;

            COMMIT;
        `,
    ).run();
  } catch (error) {
    console.error("Error migrating questions table:", error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function addQuestionToCart(
  questionId: number,
  testId: string,
): Promise<boolean> {
  const db = await openDatabase();

  try {
    // Ensure cart table exists
    await db
      .prepare(
        `
            CREATE TABLE IF NOT EXISTS cart (
                test_id TEXT,
                question_id INTEGER,
                PRIMARY KEY (test_id, question_id),
                FOREIGN KEY (question_id) REFERENCES questions(id)
            )
        `,
      )
      .run();

    // Check if question already exists in cart
    const existingEntry = await db
      .prepare("SELECT * FROM cart WHERE test_id = ? AND question_id = ?")
      .get(testId, questionId);

    if (existingEntry) {
      console.log(`Question ${questionId} already in cart for test ${testId}`);
      return false;
    }

    const stmt = await db.prepare(
      "INSERT INTO cart (test_id, question_id) VALUES (?, ?)",
    );
    await stmt.run(testId, questionId);
    return true;
  } catch (error) {
    console.error("Error adding question to cart:", error);
    return false;
  } finally {
    await db.close();
  }
}

export async function removeQuestionFromCart(
  questionId: number,
  testId: string,
): Promise<boolean> {
  const db = await openDatabase();

  try {
    const stmt = await db.prepare(
      "DELETE FROM cart WHERE test_id = ? AND question_id = ?",
    );
    const result = await stmt.run(testId, questionId);
    return result.changes > 0;
  } finally {
    await db.close();
  }
}

export async function getCartQuestions(
  testId: string,
): Promise<QuestionResult[]> {
  if (!testId) {
    console.error("getCartQuestions called with empty testId");
    return [];
  }

  const db = await openDatabase();

  try {
    console.log(`Fetching cart questions for test ID: ${testId}`);
    const query = `
            SELECT q.* FROM questions q
            JOIN cart c ON q.id = c.question_id
            WHERE c.test_id = ?
        `;
    const cartQuestions = (await db
      .prepare(query)
      .all(testId)) as QuestionResult[];
    return cartQuestions;
  } catch (error) {
    console.error("Error fetching cart questions:", error);
    return [];
  } finally {
    await db.close();
  }
}

export async function debugDatabaseSchema() {
  const db = await openDatabase();

  try {
    console.log("Questions Table Schema:");
    const questionsSchema = await db
      .prepare("PRAGMA table_info(questions)")
      .all();
    console.log(JSON.stringify(questionsSchema, null, 2));

    console.log("\nCart Table Schema:");
    const cartSchema = await db.prepare("PRAGMA table_info(cart)").all();
    console.log(JSON.stringify(cartSchema, null, 2));

    console.log("\nTables in Database:");
    const tables = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();
    console.log(JSON.stringify(tables, null, 2));
  } catch (error) {
    console.error("Error debugging database schema:", error);
  } finally {
    await db.close();
  }
}

export async function updateQuestion(
  question: QuestionResult,
): Promise<QuestionResult> {
  if (!question.id || typeof question.id !== "number" || question.id <= 0) {
    throw new Error("Invalid question ID");
  }

  const db = await openDatabase();

  try {
    // Extract fields to update, excluding id and some system fields
    const updateFields: Partial<QuestionResult> = { ...question };
    delete updateFields.id;
    delete updateFields["Last Updated"];

    // Verify the question exists before updating
    const existingQuestion = db
      .prepare("SELECT id FROM questions WHERE id = ?")
      .get(question.id);
    if (!existingQuestion) {
      throw new Error(`Question with ID ${question.id} not found`);
    }

    // Prepare the update clause dynamically
    const updateKeys = Object.keys(updateFields)
      .filter(
        (key) =>
          updateFields[key] !== undefined &&
          updateFields[key] !== null &&
          key !== "id" &&
          key !== "Last Updated",
      )
      .map((key) => `"${key}" = ?`)
      .join(", ");

    const values = Object.keys(updateFields)
      .filter(
        (key) =>
          updateFields[key] !== undefined &&
          updateFields[key] !== null &&
          key !== "id" &&
          key !== "Last Updated",
      )
      .map((key) => updateFields[key]);

    // Add question ID to the end of values for WHERE clause
    values.push(question.id);

    const query = `
            UPDATE questions 
            SET ${updateKeys}, "Last Updated" = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING *;
        `;

    console.group("Question Update Process");
    console.log("Prepared SQL query:", query);
    console.log("Update Fields:", updateFields);
    console.log("Query values:", values);

    const stmt = await db.prepare(query);
    const result = await stmt.all(...values);

    console.log("Query result rows:", result);

    if (result.length === 0) {
      console.error("No rows updated. Question might not exist.");
      console.groupEnd();
      throw new Error("Question not found or no changes made");
    }

    // Type assertion to ensure the result is a Question
    const updatedQuestion = result[0] as QuestionResult;
    console.log("Successfully updated question:", updatedQuestion);
    console.groupEnd();

    return updatedQuestion;
  } catch (error) {
    console.error("Error in updateQuestion:", error);
    console.error("Error details:", error.message, error.stack);
    throw error;
  } finally {
    await db.close();
  }
}

export async function addQuestion(
  question: QuestionResult,
): Promise<{ id: number }> {
  const db = await openDatabase();

  try {
    // Validate required fields
    if (
      !question.Question ||
      !question.Answer ||
      !question.Subject ||
      !question.Question_Type
    ) {
      throw new Error("Missing required fields for question");
    }

    // Prepare the SQL insert statement dynamically
    const columns = Object.keys(question)
      .filter((key) => question[key] !== undefined && question[key] !== null)
      .map((key) => `"${key}"`);

    const placeholders = columns.map(() => "?").join(", ");

    const values = columns.map((col) => question[col.replace(/"/g, "")]);

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
    console.error("Error details:", error.message, error.stack);
    throw error;
  } finally {
    db.close();
  }
}

// Call this function to debug schema issues
// debugDatabaseSchema();

export async function ensureDefaultUser() {
  const db = new Database(DB_PATH);

  try {
    // Check if any users exist
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();

    if (userCount.count === 0) {
      console.log("No users found. Creating default user.");

      // Hash a default password (async)
      const saltRounds = 10;
      const defaultPassword = "DefaultPassword123!";
      const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

      // Prepare insert statement
      const stmt = db.prepare(`
                INSERT INTO users (
                    username, 
                    email, 
                    password_hash, 
                    role, 
                    is_active
                ) VALUES (?, ?, ?, ?, ?)
            `);

      // Insert default user
      const result = stmt.run(
        "defaultuser",
        "default@example.com",
        hashedPassword,
        "user",
        1,
      );

      console.log("Default user created:", {
        userId: result.lastInsertRowid,
        email: "default@example.com",
      });

      return Number(result.lastInsertRowid);
    }

    return null;
  } catch (error) {
    console.error("Error creating default user:", error);
    throw error;
  } finally {
    db.close();
  }
}

export async function openDatabase() {
  const db = new Database(DB_PATH);

  // Create users table
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
            is_active BOOLEAN DEFAULT 1,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
  ).run();

  // Create unique indexes for users
  try {
    db.prepare(
      `
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)
        `,
    ).run();
    db.prepare(
      `
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)
        `,
    ).run();
  } catch (indexError) {
    console.warn(
      "Index creation might have failed (possibly already exists):",
      indexError,
    );
  }

  // Call ensureDefaultUser asynchronously
  await ensureDefaultUser();

  // Ensure draft_carts table exists
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS draft_carts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_name TEXT NOT NULL,
            batch TEXT DEFAULT '',
            date TEXT DEFAULT '',
            user_id INTEGER NOT NULL,
            questions TEXT NOT NULL,  -- Storing question IDs as JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `,
  ).run();

  // Add index for faster user-based queries
  try {
    db.prepare(
      `
            CREATE INDEX IF NOT EXISTS idx_draft_carts_user_id ON draft_carts(user_id)
        `,
    ).run();
  } catch (indexError) {
    console.warn("Index creation might have failed:", indexError);
  }

  // Ensure questions table exists
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Question TEXT NOT NULL,
            Answer TEXT NOT NULL,
            Explanation TEXT,
            Subject TEXT NOT NULL,
            "Module Number" TEXT,
            "Module Name" TEXT,
            Topic TEXT,
            "Sub Topic" TEXT,
            "Micro Topic" TEXT,
            "Faculty Approved" BOOLEAN DEFAULT 0,
            "Difficulty Level" TEXT CHECK("Difficulty Level" IN ('easy', 'medium', 'hard')),
            "Nature of Question" TEXT,
            Objective TEXT,
            Question_Type TEXT CHECK(Question_Type IN ('Objective', 'Subjective'))
        )
    `,
  ).run();

  // Ensure cart table exists
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS cart (
            test_id TEXT PRIMARY KEY,
            question_id INTEGER,
            FOREIGN KEY (question_id) REFERENCES questions(id)
        )
    `,
  ).run();

  // Ensure tests table exists
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_name TEXT NOT NULL,
            batch TEXT DEFAULT '',
            date TEXT DEFAULT '',
            user_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('draft', 'published')),
            questions TEXT NOT NULL,  -- Storing question IDs as JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `,
  ).run();

  return db;
}

export async function debugQuestionsTable() {
  const db = await openDatabase();

  try {
    // Get distinct subjects
    const subjects = await db
      .prepare("SELECT DISTINCT Subject FROM questions")
      .all();
    console.log("Distinct Subjects:", subjects);

    // Get distinct modules
    const modules = await db
      .prepare('SELECT DISTINCT "Module Name" FROM questions')
      .all();
    console.log("Distinct Modules:", modules);

    // Get sample questions
    const sampleQuestions = await db
      .prepare(
        'SELECT Subject, "Module Name", Topic, Question_Type FROM questions LIMIT 10',
      )
      .all();
    console.log("Sample Questions:", sampleQuestions);

    // Get total question count
    const totalQuestions = await db
      .prepare("SELECT COUNT(*) as total FROM questions")
      .get();
    console.log("Total Questions:", totalQuestions);

    // Get Economics module questions
    const economicsQuestions = await db
      .prepare("SELECT * FROM questions WHERE Subject = ? LIMIT 10")
      .all("Economics");
    console.log("First 10 Economics Questions:", economicsQuestions);
  } catch (error) {
    console.error("Error in debugQuestionsTable:", error);
  } finally {
    await db.close();
  }
}

export async function saveDraftCart(
  userId: number,
  testName: string,
  batch: string,
  date: string,
  questionIds: number[],
): Promise<number> {
  const db = await openDatabase();

  try {
    // Validate inputs with more detailed logging
    console.log("saveDraftCart input:", {
      userId,
      testName,
      batch,
      date,
      questionIds,
    });

    // Validate inputs
    if (!userId) {
      console.warn("No user ID provided, using default user");
      userId = 1; // Default to first user
    }
    if (!testName) {
      throw new Error("Test name is required");
    }

    // Validate user
    let userCheck = db
      .prepare("SELECT id, email FROM users WHERE id = ?")
      .get(userId);

    if (!userCheck) {
      console.warn(`User with ID ${userId} not found. Checking all users.`);

      // Log all existing users
      const allUsers = db.prepare("SELECT id, email FROM users").all();
      console.log("Existing users:", allUsers);

      // Try to use the first user if available
      userCheck = db.prepare("SELECT id FROM users LIMIT 1").get();

      if (!userCheck) {
        // If no users exist at all, create a default user
        const defaultUserResult = await ensureDefaultUser();
        userId = defaultUserResult || 1;
      } else {
        userId = userCheck.id;
      }
    }

    // Prepare the insert statement for draft_carts
    const draftCartStmt = db.prepare(`
            INSERT INTO draft_carts (
                test_name, 
                batch, 
                date, 
                user_id, 
                questions, 
                created_at, 
                updated_at
            ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

    // Convert questionIds to a JSON string
    const questionsJson = JSON.stringify(questionIds);

    // Execute the draft cart insert
    const draftCartResult = draftCartStmt.run(
      testName,
      batch || "",
      date || "",
      userId,
      questionsJson,
    );

    // Log the result of the draft cart insert
    console.log("Draft cart insert result:", {
      lastInsertRowid: draftCartResult.lastInsertRowid,
      changes: draftCartResult.changes,
    });

    // Prepare the insert statement for test management
    const testManagementStmt = db.prepare(`
            INSERT INTO tests (
                test_name, 
                batch, 
                date, 
                user_id, 
                status,
                questions,
                created_at, 
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

    // Execute the test management insert
    const testManagementResult = testManagementStmt.run(
      testName,
      batch || "",
      date || "",
      userId,
      "draft", // Set status as draft
      questionsJson,
    );

    // Log the result of the test management insert
    console.log("Test management insert result:", {
      lastInsertRowid: testManagementResult.lastInsertRowid,
      changes: testManagementResult.changes,
    });

    // Verify the inserted draft cart
    const insertedDraftCart = db
      .prepare(
        `
            SELECT * FROM draft_carts WHERE id = ?
        `,
      )
      .get(draftCartResult.lastInsertRowid);

    console.log("Inserted Draft Cart:", insertedDraftCart);

    // Return the ID of the inserted draft cart
    return Number(draftCartResult.lastInsertRowid);
  } catch (error) {
    // Comprehensive error logging
    console.error("Detailed Error saving draft cart:", {
      message: error.message,
      stack: error.stack,
      userId,
      testName,
      batch,
      date,
      questionIds,
    });
    throw error;
  } finally {
    db.close();
  }
}

export async function updateDraftCart(
  draftCartId: number,
  testName?: string,
  batch?: string,
  date?: string,
  questionIds?: number[],
): Promise<void> {
  const db = await openDatabase();

  try {
    const updateFields: string[] = [];
    const params: any[] = [];

    if (testName) {
      updateFields.push("test_name = ?");
      params.push(testName);
    }
    if (batch) {
      updateFields.push("batch = ?");
      params.push(batch);
    }
    if (date) {
      updateFields.push("date = ?");
      params.push(date);
    }
    if (questionIds) {
      updateFields.push("questions = ?");
      params.push(JSON.stringify(questionIds));
    }

    params.push(draftCartId);

    if (updateFields.length > 0) {
      const query = `UPDATE draft_carts SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await db.run(query, params);
    }
  } catch (error) {
    console.error("Error updating draft cart:", error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function getDraftCarts(userId: number): Promise<any[]> {
  const db = await openDatabase();

  try {
    // Validate or fallback to default user ID
    if (!userId) {
      console.warn("No user ID provided, using default user");
      userId = 1;
    }

    // Prepare statement to get draft carts
    const stmt = db.prepare(`
            SELECT 
                id, 
                test_name, 
                batch, 
                date, 
                questions, 
                created_at, 
                updated_at 
            FROM draft_carts 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `);

    // Execute the statement and get results
    const draftCarts = stmt.all(userId);

    // Parse questions from JSON
    const parsedDraftCarts = draftCarts.map((cart) => ({
      ...cart,
      questions: JSON.parse(cart.questions || "[]"),
    }));

    console.log("Draft carts retrieved:", {
      userId,
      draftCartsCount: parsedDraftCarts.length,
    });

    return parsedDraftCarts;
  } catch (error) {
    console.error("Error retrieving draft carts:", {
      userId,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    throw error;
  } finally {
    db.close();
  }
}

export async function getDraftCartById(
  draftCartId: number,
): Promise<any | null> {
  const db = await openDatabase();

  try {
    const cart = await db.get(
      "SELECT id, test_name, batch, date, questions FROM draft_carts WHERE id = ?",
      [draftCartId],
    );

    if (cart) {
      return {
        ...cart,
        questions: JSON.parse(cart.questions || "[]"),
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching draft cart:", error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function deleteDraftCart(draftCartId: number): Promise<void> {
  const db = await openDatabase();

  try {
    await db.run("DELETE FROM draft_carts WHERE id = ?", [draftCartId]);
  } catch (error) {
    console.error("Error deleting draft cart:", error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function getDatabaseActions() {
  return {
    saveDraftCart: async (
      userId: number,
      testName: string,
      batch: string,
      date: string,
      questionIds: number[],
    ) => {
      return await saveDraftCart(userId, testName, batch, date, questionIds);
    },
    getDraftCarts: async (userId: number) => {
      return await getDraftCarts(userId);
    },
    ensureDefaultUser: async () => {
      return await ensureDefaultUser();
    },
  };
}
