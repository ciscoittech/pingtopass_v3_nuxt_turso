import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatarUrl').default(''),
  hashedPassword: text('hashedPassword'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  bannedReason: text('bannedReason'),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).default(false),
  superAdmin: integer('superAdmin', { mode: 'boolean' }).default(false),
  phoneNumber: text('phoneNumber'),
  bannedUntil: integer('bannedUntil'),
  onboarded: integer('onboarded', { mode: 'boolean' }).default(false),
  proAccount: integer('proAccount', { mode: 'boolean' }).default(false),
  created_at: integer('created_at'),
  updated_at: integer('updated_at'),
  last_active: integer('last_active'),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert