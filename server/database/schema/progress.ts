import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const studyProgress = sqliteTable('study_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  questionId: text('question_id').notNull(),
  examId: text('exam_id'),
  objectiveId: text('objective_id'),
  timesSeen: integer('times_seen').default(0),
  timesCorrect: integer('times_correct').default(0),
  lastSeen: text('last_seen'),
  masteryLevel: integer('mastery_level').default(0),
  isStudyMode: integer('is_study_mode', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export type StudyProgress = typeof studyProgress.$inferSelect
export type NewStudyProgress = typeof studyProgress.$inferInsert

export const userProgress = sqliteTable('user_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  objectiveId: text('objective_id').notNull(),
  examId: text('exam_id').notNull(),
  questionsSeen: integer('questions_seen').default(0),
  questionsCorrect: integer('questions_correct').default(0),
  totalQuestions: integer('total_questions').default(0),
  attemptedQuestions: integer('attempted_questions').default(0),
  correctAnswers: integer('correct_answers').default(0),
  accuracyRate: real('accuracy_rate').default(0.0),
  masteryLevel: real('mastery_level').default(0),
  masteryLevelText: text('mastery_level_text').default('beginner'),
  lastStudied: text('last_studied'),
  lastActivity: text('last_activity').default(sql`CURRENT_TIMESTAMP`),
  currentStreak: integer('current_streak').default(0),
  bestStreak: integer('best_streak').default(0),
  lastStreakDate: text('last_streak_date'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export type UserProgress = typeof userProgress.$inferSelect
export type NewUserProgress = typeof userProgress.$inferInsert

export const questionAttempts = sqliteTable('question_attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  questionId: text('question_id'),
  userId: text('user_id'),
  selectedAnswerId: text('selected_answer_id'),
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  timeSpentSeconds: integer('time_spent_seconds'),
  attemptNumber: integer('attempt_number').default(1),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

export type QuestionAttempt = typeof questionAttempts.$inferSelect
export type NewQuestionAttempt = typeof questionAttempts.$inferInsert