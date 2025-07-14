import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const modelSettings = sqliteTable('model_settings', {
  id: text('id').primaryKey(),
  feature: text('feature').notNull(), // 'chat_user', 'chat_admin', 'question_generation', 'twitter_analysis'
  modelId: text('model_id').notNull(), // e.g., 'anthropic/claude-3.5-sonnet'
  modelName: text('model_name').notNull(),
  provider: text('provider').notNull(), // 'anthropic', 'openai', 'deepseek', etc.
  capabilities: text('capabilities').notNull(), // JSON: {toolCalling: true, streaming: true}
  costPerMillion: real('cost_per_million').notNull(), // Input + output averaged
  updatedBy: text('updated_by').references(() => users.id),
  updatedAt: integer('updated_at').default(sql`strftime('%s', 'now')`),
})

export type ModelSetting = typeof modelSettings.$inferSelect
export type NewModelSetting = typeof modelSettings.$inferInsert

// Default model settings that will be seeded
export const defaultModelSettings = [
  {
    id: 'ms_chat_user',
    feature: 'chat_user',
    modelId: 'google/gemini-2.5-flash-preview-05-20',
    modelName: 'Gemini 2.5 Flash Preview',
    provider: 'google',
    capabilities: JSON.stringify({ toolCalling: true, streaming: true, vision: true }),
    costPerMillion: 0.19, // Average of input (0.075) and output (0.30)
  },
  {
    id: 'ms_chat_admin',
    feature: 'chat_admin',
    modelId: 'google/gemini-2.5-flash-preview-05-20',
    modelName: 'Gemini 2.5 Flash Preview',
    provider: 'google',
    capabilities: JSON.stringify({ toolCalling: true, streaming: true, vision: true }),
    costPerMillion: 0.19, // Same model for consistency
  },
  {
    id: 'ms_question_generation',
    feature: 'question_generation',
    modelId: 'google/gemini-2.5-flash-lite-preview-06-17',
    modelName: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    capabilities: JSON.stringify({ toolCalling: true, streaming: true, vision: true }),
    costPerMillion: 0.095, // Average of input (0.04) and output (0.15)
  },
  {
    id: 'ms_twitter_analysis',
    feature: 'twitter_analysis',
    modelId: 'deepseek/deepseek-r1-0528',
    modelName: 'DeepSeek R1 (0528)',
    provider: 'deepseek',
    capabilities: JSON.stringify({ toolCalling: false, streaming: true, reasoning: true }),
    costPerMillion: 1.37, // Average of input (0.55) and output (2.19)
  },
]