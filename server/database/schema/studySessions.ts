import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { exams } from './exams'

export const studySessions = sqliteTable('study_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  examId: text('exam_id').notNull().references(() => exams.id),
  status: text('status', { enum: ['active', 'paused', 'completed', 'abandoned'] }).default('active').notNull(),
  mode: text('mode', { enum: ['sequential', 'random', 'flagged', 'incorrect', 'weak_areas'] }).default('sequential').notNull(),
  
  // Progress tracking
  currentQuestionIndex: integer('current_question_index').default(0).notNull(),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').default(0).notNull(),
  incorrectAnswers: integer('incorrect_answers').default(0).notNull(),
  skippedAnswers: integer('skipped_answers').default(0).notNull(),
  
  // Question order and answers (JSON)
  questionsOrder: text('questions_order').notNull(), // JSON array of question IDs
  answers: text('answers').default('{}').notNull(), // JSON object of questionId -> answer data
  bookmarks: text('bookmarks').default('[]').notNull(), // JSON array of bookmarked question IDs
  flags: text('flags').default('[]').notNull(), // JSON array of flagged question IDs
  
  // Time tracking
  startedAt: integer('started_at').notNull(),
  lastActivityAt: integer('last_activity_at').notNull(),
  completedAt: integer('completed_at'),
  timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
  
  // Settings
  showExplanations: integer('show_explanations', { mode: 'boolean' }).default(true).notNull(),
  showTimer: integer('show_timer', { mode: 'boolean' }).default(true).notNull(),
  autoAdvance: integer('auto_advance', { mode: 'boolean' }).default(false).notNull(),
  
  // Metadata
  metadata: text('metadata').default('{}'), // JSON for additional data
  createdAt: integer('created_at').default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`).notNull()
})

export type StudySession = typeof studySessions.$inferSelect
export type NewStudySession = typeof studySessions.$inferInsert

// Helper type for the answers JSON structure
export interface StudyAnswer {
  questionId: string
  selectedAnswers: number[]
  isCorrect: boolean
  timeSpent: number
  answeredAt: string
}