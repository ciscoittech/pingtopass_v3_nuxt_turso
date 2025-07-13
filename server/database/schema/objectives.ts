import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { exams } from './exams'

export const objectives = sqliteTable('objectives', {
  id: text('id').primaryKey(),
  examId: text('exam_id').references(() => exams.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  weight: real('weight'), // Percentage weight of this objective in the exam
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})