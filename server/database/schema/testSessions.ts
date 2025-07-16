import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { exams } from './exams'

export const testSessions = sqliteTable('test_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  examId: text('exam_id').notNull().references(() => exams.id),
  status: text('status', { enum: ['active', 'paused', 'submitted', 'expired', 'abandoned'] }).default('active').notNull(),
  
  // Test configuration
  timeLimitSeconds: integer('time_limit_seconds').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  passingScore: integer('passing_score').notNull(), // Percentage (e.g., 70)
  
  // Progress tracking
  currentQuestionIndex: integer('current_question_index').default(0).notNull(),
  answeredCount: integer('answered_count').default(0).notNull(),
  flaggedCount: integer('flagged_count').default(0).notNull(),
  
  // Question order and answers (JSON)
  questionsOrder: text('questions_order').notNull(), // JSON array of question IDs
  answers: text('answers').default('{}').notNull(), // JSON object of questionIndex -> selectedAnswers
  flagged: text('flagged').default('[]').notNull(), // JSON array of flagged question indices
  
  // Time tracking
  startedAt: integer('started_at').notNull(),
  lastActivityAt: integer('last_activity_at').notNull(),
  submittedAt: integer('submitted_at'),
  timeRemainingSeconds: integer('time_remaining_seconds').notNull(),
  
  // Results (populated after submission)
  score: real('score'), // Percentage score
  correctCount: integer('correct_count'),
  incorrectCount: integer('incorrect_count'),
  unansweredCount: integer('unanswered_count'),
  passed: integer('passed', { mode: 'boolean' }),
  
  // Auto-save state
  lastAutoSaveAt: integer('last_auto_save_at'),
  autoSaveCount: integer('auto_save_count').default(0).notNull(),
  
  // Metadata
  metadata: text('metadata').default('{}'), // JSON for additional data
  createdAt: integer('created_at').default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`).notNull()
})

export type TestSession = typeof testSessions.$inferSelect
export type NewTestSession = typeof testSessions.$inferInsert

// Helper type for the answers JSON structure
export interface TestAnswer {
  questionIndex: number
  selectedAnswers: number[]
  timeSpent?: number
  flagged: boolean
}