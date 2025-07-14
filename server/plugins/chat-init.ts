import { useDB } from '~/server/utils/db'
import { sql } from 'drizzle-orm'
import { defaultModelSettings } from '~/server/database/schema/settings'

export default defineNitroPlugin(async () => {
  console.log('Initializing chat tables...')
  
  try {
    const db = useDB()
    
    // Create chat_sessions table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        title TEXT,
        context TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    
    // Create chat_messages table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        session_id TEXT,
        role TEXT,
        content TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `)
    
    // Create indexes
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)
    `)
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)
    `)
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)
    `)
    
    // Create model_settings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS model_settings (
        id TEXT PRIMARY KEY,
        feature TEXT NOT NULL,
        model_id TEXT NOT NULL,
        model_name TEXT NOT NULL,
        provider TEXT NOT NULL,
        capabilities TEXT NOT NULL,
        cost_per_million REAL NOT NULL,
        updated_by TEXT REFERENCES users(id),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)
    
    // Seed default model settings
    for (const setting of defaultModelSettings) {
      try {
        await db.run(sql`
          INSERT OR IGNORE INTO model_settings (
            id, feature, model_id, model_name, provider, capabilities, cost_per_million
          ) VALUES (
            ${setting.id},
            ${setting.feature},
            ${setting.modelId},
            ${setting.modelName},
            ${setting.provider},
            ${setting.capabilities},
            ${setting.costPerMillion}
          )
        `)
      } catch (e) {
        // Ignore duplicate entries
      }
    }
    
    console.log('✅ Chat tables initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize chat tables:', error)
  }
})