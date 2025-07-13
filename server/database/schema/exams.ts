import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { vendors } from './vendors'

export const exams = sqliteTable('exams', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id').notNull().references(() => vendors.id),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  passingScore: integer('passing_score'),
  questionCount: integer('question_count'),
  duration: integer('duration'),
  price: integer('price'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
})

export type Exam = typeof exams.$inferSelect
export type NewExam = typeof exams.$inferInsert