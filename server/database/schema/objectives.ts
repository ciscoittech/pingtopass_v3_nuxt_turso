import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { exams } from './exams'

export const objectives = sqliteTable('objectives', {
  id: text('id').primaryKey(),
  examId: text('exam_id').references(() => exams.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  weight: real('weight').notNull().default(10), // Percentage weight of this objective in the exam
  order: integer('order').notNull().default(1), // Display order for drag-and-drop
  isActive: integer('is_active').notNull().default(1), // 1 = active, 0 = inactive
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})