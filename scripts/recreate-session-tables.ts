import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config()

async function recreateSessionTables() {
  // Create database connection
  const client = createClient({
    url: process.env.TURSO_DB_URL || process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_DB_TOKEN || process.env.TURSO_AUTH_TOKEN || ''
  })
  
  const db = drizzle(client)
  
  console.log('🔄 Recreating session tables...\n')
  
  try {
    // Drop existing tables
    console.log('Dropping existing tables...')
    await db.run(sql`DROP TABLE IF EXISTS study_sessions`)
    await db.run(sql`DROP TABLE IF EXISTS test_sessions`)
    console.log('✅ Tables dropped\n')
    
    // Read and apply the migration
    const migrationPath = path.join(__dirname, '../drizzle/0001_add_session_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    // Split by statement breakpoint
    const allStatements = migrationSQL.split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    // Only get the CREATE TABLE statements (first 2)
    const createStatements = allStatements.filter(s => s.includes('CREATE TABLE'))
    
    console.log(`📋 Found ${createStatements.length} CREATE TABLE statements\n`)
    
    // Execute each statement
    for (let i = 0; i < createStatements.length; i++) {
      const statement = createStatements[i]
      console.log(`Executing CREATE TABLE ${i + 1}/${createStatements.length}...`)
      
      try {
        await db.run(sql.raw(statement))
        console.log(`✅ Table ${i + 1} created successfully`)
      } catch (error: any) {
        console.error(`❌ Table ${i + 1} failed:`, error.message)
      }
    }
    
    // Now create indexes
    const indexStatements = allStatements.filter(s => s.includes('CREATE INDEX'))
    console.log(`\n📋 Creating ${indexStatements.length} indexes...\n`)
    
    for (let i = 0; i < indexStatements.length; i++) {
      const statement = indexStatements[i]
      try {
        await db.run(sql.raw(statement))
        console.log(`✅ Index ${i + 1} created`)
      } catch (error: any) {
        console.error(`❌ Index ${i + 1} failed:`, error.message)
      }
    }
    
    console.log('\n🔍 Verifying new table structure...\n')
    
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
    
    console.log('\n✨ Tables recreated successfully!')
    
  } catch (error) {
    console.error('❌ Error recreating tables:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

recreateSessionTables().catch(console.error)