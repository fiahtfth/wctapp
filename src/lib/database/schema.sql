-- Questions Table
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
);

-- Users Table
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
);

-- Create an index for faster username/email lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Cart/Test Table
CREATE TABLE IF NOT EXISTS cart (
    test_id TEXT PRIMARY KEY,
    question_id INTEGER,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Sample Data Insertion
INSERT INTO questions (
    Question, 
    Answer, 
    Explanation, 
    Subject, 
    "Module Number", 
    "Module Name", 
    Topic, 
    "Sub Topic", 
    "Micro Topic", 
    "Faculty Approved", 
    "Difficulty Level", 
    "Nature of Question", 
    Objective, 
    Question_Type
) VALUES 
(
    'What is the capital of France?', 
    'Paris', 
    'Paris is the capital and largest city of France', 
    'Geography', 
    NULL, 
    NULL, 
    'European Capitals', 
    'France', 
    NULL, 
    0, 
    'easy', 
    'factual', 
    NULL, 
    'Objective'
),
(
    'What is the derivative of x^2?', 
    '2x', 
    'The derivative of x^2 is 2x using the power rule of differentiation', 
    'Mathematics', 
    NULL, 
    NULL, 
    'Differentiation', 
    'Basic Derivatives', 
    NULL, 
    0, 
    'medium', 
    'analytical', 
    NULL, 
    'Objective'
);
