import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { exams } from './exams'
import { questions, answers } from './questions'

export const studySessions = sqliteTable('study_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  examId: text('exam_id').references(() => exams.id),
  startedAt: text('started_at').default(sql`datetime('now')`),
  lastActivity: text('last_activity').default(sql`datetime('now')`),
  questionsAnswered: integer('questions_answered').default(0),
  correctAnswers: integer('correct_answers').default(0),
  totalTimeSeconds: integer('total_time_seconds').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
})

export type StudySession = typeof studySessions.$inferSelect
export type NewStudySession = typeof studySessions.$inferInsert

export const testSessions = sqliteTable('test_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  examId: text('exam_id').notNull().references(() => exams.id),
  sessionType: text('session_type').notNull(), // 'study' or 'test'
  score: real('score').default(0),
  passed: integer('passed', { mode: 'boolean' }).default(false),
  timeSpentSeconds: integer('time_spent_seconds'),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  startedAt: text('started_at').default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at'),
  status: text('status').default('in_progress'),
  startTime: text('start_time').default(sql`CURRENT_TIMESTAMP`),
  endTime: text('end_time'),
  timeLimitMinutes: integer('time_limit_minutes').default(90),
  questionsCount: integer('questions_count').default(0),
  questionsAnswered: integer('questions_answered').default(0),
  questionIds: text('question_ids'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  scorePercentage: real('score_percentage').default(0),
  passingScore: real('passing_score').default(70),
})

export type TestSession = typeof testSessions.$inferSelect
export type NewTestSession = typeof testSessions.$inferInsert

export const testResponses = sqliteTable('test_responses', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => testSessions.id),
  questionId: text('question_id').notNull().references(() => questions.id),
  selectedAnswerId: text('selected_answer_id').references(() => answers.id),
  isCorrect: integer('is_correct', { mode: 'boolean' }).default(false),
  timeSpentSeconds: integer('time_spent_seconds'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export type TestResponse = typeof testResponses.$inferSelect
export type NewTestResponse = typeof testResponses.$inferInsert

export const testSessionQuestions = sqliteTable('test_session_questions', {
  id: text('id').primaryKey().default(sql`lower(hex(randomblob(16)))`),
  sessionId: text('session_id').notNull().references(() => testSessions.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  questionOrder: integer('question_order').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export type TestSessionQuestion = typeof testSessionQuestions.$inferSelect
export type NewTestSessionQuestion = typeof testSessionQuestions.$inferInsert