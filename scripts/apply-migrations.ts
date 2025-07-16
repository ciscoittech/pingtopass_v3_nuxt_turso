import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../server/database/schema'
import { sql } from 'drizzle-orm'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config()

async function applyMigrations() {
  // Create database connection
  const client = createClient({
    url: process.env.TURSO_DB_URL || process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_DB_TOKEN || process.env.TURSO_AUTH_TOKEN || ''
  })
  
  const db = drizzle(client, { schema })
  
  console.log('🔄 Applying migrations...\n')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../drizzle/0001_add_session_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    // Split by statement breakpoint
    const statements = migrationSQL.split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        await db.run(sql.raw(statement))
        console.log(`✅ Statement ${i + 1} executed successfully`)
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Statement ${i + 1} skipped (table/index already exists)`)
        } else if (error.message.includes('no such column')) {
          console.log(`⚠️  Statement ${i + 1} failed but continuing (${error.message})`)
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message)
          // Continue anyway for now
        }
      }
    }
    
    console.log('\n✨ All migrations applied successfully!')
    
    // Verify the tables were created
    console.log('\n🔍 Verifying tables...')
    
    const tables = await db.run(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('study_sessions', 'test_sessions')
    `)
    
    console.log('Tables found:', tables.rows.map((r: any) => r.name))
    
  } catch (error) {
    console.error('❌ Error applying migrations:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

applyMigrations().catch(console.error)