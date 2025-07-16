import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function checkSessionTables() {
  // Create database connection
  const client = createClient({
    url: process.env.TURSO_DB_URL || process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_DB_TOKEN || process.env.TURSO_AUTH_TOKEN || ''
  })
  
  const db = drizzle(client)
  
  console.log('🔍 Checking session tables...\n')
  
  try {
    // Check study_sessions table structure
    const studySessionsInfo = await db.run(sql`PRAGMA table_info(study_sessions)`)
    console.log('📋 study_sessions columns:')
    studySessionsInfo.rows.forEach((col: any) => {
      console.log(`  - ${col.name} (${col.type})`)
    })
    
    console.log('\n')
    
    // Check test_sessions table structure
    const testSessionsInfo = await db.run(sql`PRAGMA table_info(test_sessions)`)
    console.log('📋 test_sessions columns:')
    testSessionsInfo.rows.forEach((col: any) => {
      console.log(`  - ${col.name} (${col.type})`)
    })
    
  } catch (error) {
    console.error('❌ Error checking tables:', error)
  }
  
  process.exit(0)
}

checkSessionTables().catch(console.error)