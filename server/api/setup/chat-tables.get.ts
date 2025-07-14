import { useDB } from '~/server/utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // This endpoint is for initial setup only - no auth required
  const db = useDB()
  
  try {
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
    
    // Create indexes for better performance
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)
    `)
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)
    `)
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)
    `)
    
    // Also ensure model_settings table exists
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
    const { defaultModelSettings } = await import('~/server/database/schema/settings')
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
        console.log(`Model setting ${setting.id} already exists`)
      }
    }
    
    return {
      success: true,
      message: 'Chat tables created successfully',
      tables: ['chat_sessions', 'chat_messages', 'model_settings']
    }
  } catch (error: any) {
    console.error('Migration error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create chat tables'
    }
  }
})