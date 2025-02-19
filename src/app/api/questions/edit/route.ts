import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";

const db = new Database("./src/lib/database/questions.db");

// Utility function to capitalize and validate fields
function processField(field: string, value: any): any {
  // If value is null or undefined, return as is
  if (value === null || value === undefined) {
    // Special handling for Difficulty Level
    if (field === "Difficulty Level") {
      return "medium";
    }
    return value;
  }

  // Convert to string if not already a string
  const stringValue = String(value).trim();

  switch (field) {
    case "Difficulty Level": {
      const validDifficultyLevels = ["easy", "medium", "difficult"];
      const lowercaseDifficulty = stringValue.toLowerCase();

      console.log("Processing Difficulty Level:", {
        input: stringValue,
        lowercased: lowercaseDifficulty,
        isValid: validDifficultyLevels.includes(lowercaseDifficulty),
      });

      return validDifficultyLevels.includes(lowercaseDifficulty)
        ? lowercaseDifficulty
        : "medium";
    }
    case "Question_Type":
    case "Question Type": {
      const validQuestionTypes = [
        "Objective",
        "Subjective",
        "MCQ",
        "True/False",
        "Fill in the Blank",
      ];

      const capitalizedType = stringValue
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");

      return validQuestionTypes.includes(capitalizedType)
        ? capitalizedType
        : "Objective";
    }
    case "Nature of Question": {
      const validNatureOfQuestions = ["Factual", "Conceptual", "Analytical"];
      const capitalizedNature =
        stringValue.charAt(0).toUpperCase() +
        stringValue.slice(1).toLowerCase();

      return validNatureOfQuestions.includes(capitalizedNature)
        ? capitalizedNature
        : "Theoretical";
    }
    case "Faculty Approved": {
      // Convert to boolean
      console.log("Processing Faculty Approved:", {
        input: stringValue,
        isValid: stringValue.toLowerCase() === "true" || stringValue === "1",
      });

      return stringValue.toLowerCase() === "true" || stringValue === "1";
    }
    default: {
      // For other fields, trim and return
      console.log("Processing default field:", {
        input: stringValue,
        output: stringValue || null,
      });

      return stringValue || null;
    }
  }
}

// Utility function to validate Answer
function isValidAnswer(answer: string): boolean {
  // Allow single letters a, b, c, d (case-insensitive)
  // Allow multiple letters/words for other types of questions
  if (!answer) return false;

  // Trim and convert to lowercase
  const trimmedAnswer = answer.trim().toLowerCase();

  // Single letter answers for multiple choice
  if (/^[a-d]$/.test(trimmedAnswer)) return true;

  // For other types of answers, require at least 2 characters
  return trimmedAnswer.length >= 2;
}

// Utility function to validate Difficulty Level
function isValidDifficultyLevel(level: string): boolean {
  const validLevels = ["easy", "medium", "difficult"];
  if (!level) return false;

  // Trim and convert to lowercase
  const formattedLevel = level.trim().toLowerCase();

  return validLevels.includes(formattedLevel);
}

// Utility function to standardize Difficulty Level
function standardizeDifficultyLevel(level: string): string {
  if (!level) return "medium";

  const lowercaseLevel = level.trim().toLowerCase();

  switch (lowercaseLevel) {
    case "easy":
      return "easy";
    case "hard":
    case "difficult":
      return "difficult";
    case "medium":
    default:
      return "medium";
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.group("QUESTION EDIT API ROUTE");
    console.log("1. Request Received");

    // Parse and validate the request body
    const body = await request.json();
    const question = body;

    // CRITICAL: Log ENTIRE question object with ALL keys
    console.log(
      "2. FULL Question Object (ALL KEYS):",
      Object.keys(question).reduce((acc, key) => {
        acc[key] = question[key];
        return acc;
      }, {}),
    );

    // Log ALL keys and their types
    console.log(
      "2b. Question Object Key Types:",
      Object.keys(question).reduce((acc, key) => {
        acc[key] = typeof question[key];
        return acc;
      }, {}),
    );

    // Enhanced ID validation
    const questionId =
      typeof question.id === "string"
        ? parseInt(question.id, 10)
        : Number(question.id);

    if (isNaN(questionId) || questionId <= 0) {
      console.error("5. Invalid question ID", {
        originalId: question.id,
        parsedId: questionId,
      });
      console.groupEnd();
      return new NextResponse(
        JSON.stringify({
          error: "Invalid question ID",
          details: {
            id: question.id,
            type: typeof question.id,
            parsedId: questionId,
          },
        }),
        { status: 400 },
      );
    }

    // Fetch the original question to use as a fallback
    const originalQuestionStmt = db.prepare(
      "SELECT * FROM questions WHERE id = ?",
    );
    const originalQuestion = originalQuestionStmt.get(questionId);

    if (!originalQuestion) {
      console.error("6. Original question not found", { questionId });
      console.groupEnd();
      return new NextResponse(
        JSON.stringify({
          error: "Question not found",
          details: { id: questionId },
        }),
        { status: 404 },
      );
    }

    // Log original question for comparison
    console.log(
      "6b. Original Question:",
      Object.keys(originalQuestion).reduce((acc, key) => {
        acc[key] = originalQuestion[key];
        return acc;
      }, {}),
    );

    // Process and validate each field
    const processedQuestion = {
      ...Object.keys(question).reduce((acc, key) => {
        acc[key] = processField(key, question[key]);
        return acc;
      }, {} as any),
      id: questionId, // Use validated ID
    };

    console.log(
      "3. Processed Question Object:",
      JSON.stringify(processedQuestion, null, 2),
    );

    // Validate core question content
    const validationErrors: string[] = [];

    // Question validation with fallback to original
    const finalQuestion =
      processedQuestion.Question?.trim().length >= 5
        ? processedQuestion.Question
        : originalQuestion.Question;

    // Answer validation with fallback to original and special handling for single letters
    const finalAnswer = processedQuestion.Answer
      ? isValidAnswer(processedQuestion.Answer)
        ? processedQuestion.Answer
        : originalQuestion.Answer
      : originalQuestion.Answer;

    // Difficulty Level validation and standardization
    const inputDifficultyLevel = processedQuestion["Difficulty Level"] || "";
    const finalDifficultyLevel = processedQuestion["Difficulty Level"]
      ? isValidDifficultyLevel(processedQuestion["Difficulty Level"])
        ? standardizeDifficultyLevel(processedQuestion["Difficulty Level"])
        : "medium"
      : "medium";

    console.log("Difficulty Level Processing:", {
      inputLevel: inputDifficultyLevel,
      processedLevel: finalDifficultyLevel,
      isValid: isValidDifficultyLevel(inputDifficultyLevel),
    });

    if (!finalQuestion || finalQuestion.trim().length < 5) {
      validationErrors.push("Question must be at least 5 characters long");
    }
    if (!finalAnswer) {
      validationErrors.push("Answer is required");
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      console.error("7. EDIT VALIDATION ERRORS:", validationErrors);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
          originalQuestion: originalQuestion,
        },
        { status: 400 },
      );
    }

    // Prepare update statement
    const stmt = db.prepare(`
            UPDATE questions 
            SET 
                Question = ?, 
                Answer = ?, 
                Subject = ?, 
                Topic = ?, 
                'Difficulty Level' = ?, 
                'Question_Type' = ?, 
                'Nature of Question' = ?, 
                'Faculty Approved' = ?,
                Explanation = ?,
                'Sub Topic' = ?,
                'Micro Topic' = ?,
                'Module Name' = ?,
                'Module Number' = ?
            WHERE id = ?
        `);

    // Execute update with fallback values
    const result = stmt.run(
      finalQuestion,
      finalAnswer,
      processedQuestion.Subject || originalQuestion.Subject,
      processedQuestion.Topic || originalQuestion.Topic,
      finalDifficultyLevel,
      processedQuestion["Question_Type"] ||
        processedQuestion["Question Type"] ||
        originalQuestion["Question_Type"] ||
        null,
      processedQuestion["Nature of Question"] ||
        originalQuestion["Nature of Question"] ||
        null,
      processedQuestion["Faculty Approved"] !== undefined
        ? processedQuestion["Faculty Approved"]
          ? 1
          : 0
        : originalQuestion["Faculty Approved"]
          ? 1
          : 0,
      processedQuestion.Explanation || originalQuestion.Explanation || "",
      processedQuestion["Sub Topic"] || originalQuestion["Sub Topic"] || "",
      processedQuestion["Micro Topic"] || originalQuestion["Micro Topic"] || "",
      processedQuestion["Module Name"] || originalQuestion["Module Name"] || "",
      processedQuestion["Module Number"] ||
        originalQuestion["Module Number"] ||
        "",
      processedQuestion.id,
    );

    console.log("8. Database Update Result:", {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    });

    // Fetch the updated question to return
    const updatedQuestionStmt = db.prepare(
      "SELECT * FROM questions WHERE id = ?",
    );
    const updatedQuestion = updatedQuestionStmt.get(processedQuestion.id);

    console.log(
      "9. Updated Question:",
      JSON.stringify(updatedQuestion, null, 2),
    );
    console.groupEnd();

    return NextResponse.json(updatedQuestion, { status: 200 });
  } catch (error) {
    console.error("10. EDIT ROUTE CRITICAL ERROR:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : "No stack trace",
        },
      },
      { status: 500 },
    );
  }
}
