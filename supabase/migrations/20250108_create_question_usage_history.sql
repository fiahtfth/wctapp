-- Create question_usage_history table for tracking historical question usage
CREATE TABLE IF NOT EXISTS question_usage_history (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  batch TEXT NOT NULL,
  used_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exported_by INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_batch_question 
ON question_usage_history(batch, question_id);

CREATE INDEX IF NOT EXISTS idx_usage_question 
ON question_usage_history(question_id);

CREATE INDEX IF NOT EXISTS idx_usage_batch 
ON question_usage_history(batch);

CREATE INDEX IF NOT EXISTS idx_usage_date 
ON question_usage_history(used_date DESC);

-- Add comments for documentation
COMMENT ON TABLE question_usage_history IS 'Tracks when and where questions were used/exported';
COMMENT ON COLUMN question_usage_history.question_id IS 'Reference to the question that was used';
COMMENT ON COLUMN question_usage_history.test_id IS 'ID of the test where question was used';
COMMENT ON COLUMN question_usage_history.test_name IS 'Name of the test';
COMMENT ON COLUMN question_usage_history.batch IS 'Batch identifier for grouping tests';
COMMENT ON COLUMN question_usage_history.used_date IS 'Date when question was exported/used';
COMMENT ON COLUMN question_usage_history.exported_by IS 'User ID who exported the test';
COMMENT ON COLUMN question_usage_history.metadata IS 'Additional metadata about the usage';
