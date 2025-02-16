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
