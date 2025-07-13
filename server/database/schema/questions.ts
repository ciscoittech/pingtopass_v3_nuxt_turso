import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull(),
  objectiveId: text('objective_id'),
  questionText: text('question_text').notNull(),
  questionType: text('question_type').notNull(),
  options: text('options'), // JSON array of options
  correctAnswer: text('correct_answer'), // JSON array of correct answers
  explanation: text('explanation'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert

export const answers = sqliteTable('answers', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().references(() => questions.id),
  answerText: text('answer_text').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).default(false),
  orderIndex: integer('order_index').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export type Answer = typeof answers.$inferSelect
export type NewAnswer = typeof answers.$inferInsert