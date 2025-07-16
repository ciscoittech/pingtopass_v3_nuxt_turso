-- Add missing columns to questions table for proper exam functionality
-- This migration adds exam_id, options, correct_answer, and resources columns

-- Add exam_id column to questions table
ALTER TABLE questions ADD COLUMN exam_id TEXT;

-- Add options column for storing answer choices as JSON array
ALTER TABLE questions ADD COLUMN options TEXT DEFAULT '[]';

-- Add correct_answer column for storing correct answer indices as JSON array
ALTER TABLE questions ADD COLUMN correct_answer TEXT DEFAULT '[]';

-- Add resources column for storing learning resources as JSON array
ALTER TABLE questions ADD COLUMN resources TEXT DEFAULT '[]';

-- Create index on exam_id for performance
CREATE INDEX questions_exam_idx ON questions(exam_id);

-- Update existing questions to populate exam_id from their objectives
-- This maintains data integrity for any existing questions
UPDATE questions 
SET exam_id = (
    SELECT exams.id 
    FROM objectives 
    JOIN exams ON objectives.exam_id = exams.id 
    WHERE objectives.id = questions.objective_id
)
WHERE exam_id IS NULL;

-- Create seeding metadata table to track what has been seeded
CREATE TABLE IF NOT EXISTS seeding_metadata (
    id TEXT PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
    exam_code TEXT NOT NULL,
    checksum TEXT NOT NULL,
    questions_count INTEGER,
    seeded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_code, checksum)
);

-- Add foreign key constraint for exam_id (commented out as SQLite doesn't support ALTER TABLE ADD CONSTRAINT)
-- In production, this would be: ALTER TABLE questions ADD CONSTRAINT fk_questions_exam FOREIGN KEY (exam_id) REFERENCES exams(id);