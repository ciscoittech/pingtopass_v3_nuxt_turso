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
    modelId: 'deepseek/deepseek-chat',
    modelName: 'DeepSeek Chat',
    provider: 'deepseek',
    capabilities: JSON.stringify({ toolCalling: false, streaming: true, reasoning: true }),
    costPerMillion: 0.21, // Average of input (0.14) and output (0.28)
  },
  {
    id: 'ms_chat_admin',
    feature: 'chat_admin',
    modelId: 'openai/gpt-4o',
    modelName: 'GPT-4 Optimized',
    provider: 'openai',
    capabilities: JSON.stringify({ toolCalling: true, streaming: true, reasoning: true }),
    costPerMillion: 6.25, // Average of input (2.50) and output (10.00)
  },
  {
    id: 'ms_question_generation',
    feature: 'question_generation',
    modelId: 'anthropic/claude-3.5-haiku',
    modelName: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    capabilities: JSON.stringify({ toolCalling: false, streaming: true, reasoning: true }),
    costPerMillion: 3.0, // Average of input (1.00) and output (5.00)
  },
  {
    id: 'ms_twitter_analysis',
    feature: 'twitter_analysis',
    modelId: 'deepseek/deepseek-chat',
    modelName: 'DeepSeek Chat',
    provider: 'deepseek',
    capabilities: JSON.stringify({ toolCalling: false, streaming: true, reasoning: true }),
    costPerMillion: 0.21,
  },
]