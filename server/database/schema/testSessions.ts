import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { exams } from './exams'

export const testSessions = sqliteTable('test_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  
  // Test configuration
  timeLimit: integer('time_limit').notNull(), // in seconds
  totalQuestions: integer('total_questions').notNull(),
  questionIds: text('question_ids').notNull(), // JSON array of question IDs
  
  // Test state
  status: text('status').notNull().default('active'), // 'active', 'submitted', 'expired'
  currentQuestionIndex: integer('current_question_index').default(0),
  answers: text('answers').notNull().default('{}'), // JSON object: { questionId: selectedAnswers[] }
  reviewFlags: text('review_flags').default('{}'), // JSON object: { questionId: boolean }
  
  // Timing
  startedAt: integer('started_at').notNull(),
  submittedAt: integer('submitted_at'),
  timeSpent: integer('time_spent'), // in seconds
  timeRemaining: integer('time_remaining'), // in seconds
  
  // Results (calculated after submission)
  totalScore: integer('total_score'),
  maxPossibleScore: integer('max_possible_score'),
  correctAnswers: integer('correct_answers'),
  incorrectAnswers: integer('incorrect_answers'),
  skippedAnswers: integer('skipped_answers'),
  passPercentage: integer('pass_percentage'), // required to pass
  hasPassed: integer('has_passed', { mode: 'boolean' }),
  
  // Section breakdown (JSON)
  sectionScores: text('section_scores'), // JSON: { sectionId: { correct, total, percentage } }
  
  // Metadata
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type TestSession = typeof testSessions.$inferSelect
export type NewTestSession = typeof testSessions.$inferInsert