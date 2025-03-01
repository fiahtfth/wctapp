-- Create questions table
CREATE TABLE questions (
    id BIGINT PRIMARY KEY,
    "Question" TEXT,
    "Answer" TEXT,
    "Explanation" TEXT,
    "Subject" TEXT,
    "Module Name" TEXT,
    "Topic" TEXT,
    "Sub Topic" TEXT,
    "Difficulty Level" TEXT,
    "Question_Type" TEXT,
    "Nature of Question" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_questions_subject ON questions("Subject");
CREATE INDEX idx_questions_module_name ON questions("Module Name");
CREATE INDEX idx_questions_topic ON questions("Topic");
CREATE INDEX idx_questions_difficulty_level ON questions("Difficulty Level");
CREATE INDEX idx_questions_question_type ON questions("Question_Type");