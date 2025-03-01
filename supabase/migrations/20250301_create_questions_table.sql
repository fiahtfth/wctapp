-- Create questions table
CREATE TABLE questions (
    id BIGINT PRIMARY KEY,
    text TEXT,
    answer TEXT,
    explanation TEXT,
    subject TEXT,
    module_name TEXT,
    topic TEXT,
    sub_topic TEXT,
    difficulty_level TEXT,
    question_type TEXT,
    nature_of_question TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_module_name ON questions(module_name);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty_level ON questions(difficulty_level);
CREATE INDEX idx_questions_question_type ON questions(question_type);
