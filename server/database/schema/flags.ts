import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { questions } from './questions'

export const flags = sqliteTable('flags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  flagType: text('flag_type').notNull(), // 'review', 'difficult', 'incorrect', 'confusing'
  reason: text('reason'), // Optional detailed reason
  createdAt: integer('created_at').notNull(),
  resolvedAt: integer('resolved_at'), // When user marks as resolved
  isResolved: integer('is_resolved', { mode: 'boolean' }).default(false),
})

export type Flag = typeof flags.$inferSelect
export type NewFlag = typeof flags.$inferInsert