import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  website: text('website'),
  logoUrl: text('logo_url'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
})

export type Vendor = typeof vendors.$inferSelect
export type NewVendor = typeof vendors.$inferInsert