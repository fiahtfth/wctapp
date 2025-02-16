-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    subject TEXT NOT NULL,
    module TEXT,
    topic TEXT,
    sub_topic TEXT,
    difficulty_level TEXT CHECK(difficulty_level IN ('easy', 'medium', 'hard')),
    nature_of_question TEXT
);

-- Cart/Test Table
CREATE TABLE IF NOT EXISTS cart (
    test_id TEXT PRIMARY KEY,
    question_id INTEGER,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Sample Data Insertion
INSERT INTO questions (
    question_text, 
    answer, 
    explanation, 
    subject, 
    module, 
    topic, 
    sub_topic, 
    difficulty_level, 
    nature_of_question
) VALUES 
(
    'What is the capital of France?', 
    'Paris', 
    'Paris is the capital and largest city of France', 
    'Geography', 
    'World Capitals', 
    'European Capitals', 
    'France', 
    'easy', 
    'factual'
),
(
    'What is the derivative of x^2?', 
    '2x', 
    'The derivative of x^2 is 2x using the power rule of differentiation', 
    'Mathematics', 
    'Calculus', 
    'Differentiation', 
    'Basic Derivatives', 
    'medium', 
    'analytical'
);
