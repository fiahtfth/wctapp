-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the questions table
CREATE OR REPLACE FUNCTION create_questions_table()
RETURNS VOID AS $$
BEGIN
  -- Check if table already exists to prevent errors
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'questions'
  ) THEN
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

    -- Create indexes for performance
    CREATE INDEX idx_questions_subject ON questions(subject);
    CREATE INDEX idx_questions_module_name ON questions(module_name);
    CREATE INDEX idx_questions_topic ON questions(topic);
    CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
