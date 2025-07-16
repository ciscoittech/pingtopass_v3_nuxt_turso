import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database client
const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

// Parse SQL file into individual statements
function parseSqlStatements(sql: string): string[] {
  // Remove comments and split by semicolon
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--')) // Remove comment lines
    .join('\n')
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0)
  
  return statements
}

// Execute a single SQL statement with error handling
async function executeSqlStatement(statement: string, index: number): Promise<boolean> {
  try {
    console.log(`\n🔄 Executing statement ${index + 1}:`)
    console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`)
    
    await db.execute(statement)
    console.log(`   ✅ Success`)
    return true
  } catch (error: any) {
    // Check for common errors that we can safely ignore
    if (error.message.includes('duplicate column name') || 
        error.message.includes('column already exists')) {
      console.log(`   ⚠️  Column already exists (skipping)`)
      return true
    } else if (error.message.includes('table') && error.message.includes('already exists')) {
      console.log(`   ⚠️  Table already exists (skipping)`)
      return true
    } else if (error.message.includes('index') && error.message.includes('already exists')) {
      console.log(`   ⚠️  Index already exists (skipping)`)
      return true
    } else {
      console.error(`   ❌ Error: ${error.message}`)
      return false
    }
  }
}

// Check current schema
async function checkCurrentSchema() {
  console.log('\n📊 Checking current questions table schema...')
  
  try {
    const result = await db.execute(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='questions'
    `)
    
    if (result.rows.length > 0) {
      const tableSchema = result.rows[0].sql as string
      console.log('Current schema:')
      console.log(tableSchema)
      
      // Check which columns exist
      const hasExamId = tableSchema.includes('exam_id')
      const hasOptions = tableSchema.includes('options')
      const hasCorrectAnswer = tableSchema.includes('correct_answer')
      const hasResources = tableSchema.includes('resources')
      
      console.log('\nColumn status:')
      console.log(`  - exam_id: ${hasExamId ? '✅ exists' : '❌ missing'}`)
      console.log(`  - options: ${hasOptions ? '✅ exists' : '❌ missing'}`)
      console.log(`  - correct_answer: ${hasCorrectAnswer ? '✅ exists' : '❌ missing'}`)
      console.log(`  - resources: ${hasResources ? '✅ exists' : '❌ missing'}`)
    } else {
      console.log('❌ Questions table not found!')
    }
  } catch (error) {
    console.error('Error checking schema:', error)
  }
}

// Main function to apply migration
async function applyMigration() {
  console.log('🚀 Starting manual migration process...')
  console.log(`   Database: ${process.env.TURSO_DB_URL}`)
  
  try {
    // Check current schema first
    await checkCurrentSchema()
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'drizzle', '0002_add_question_columns.sql')
    console.log(`\n📄 Reading migration file: ${migrationPath}`)
    
    const migrationContent = await fs.readFile(migrationPath, 'utf-8')
    console.log(`   ✅ Migration file loaded (${migrationContent.length} bytes)`)
    
    // Parse SQL statements
    const statements = parseSqlStatements(migrationContent)
    console.log(`\n📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const success = await executeSqlStatement(statements[i], i)
      if (success) {
        if (statements[i].includes('already exists')) {
          skipCount++
        } else {
          successCount++
        }
      } else {
        errorCount++
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ⚠️  Skipped (already exists): ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    
    // Verify final schema
    console.log('\n🔍 Verifying final schema...')
    await checkCurrentSchema()
    
    // Check if seeding_metadata table was created
    const seedingTableResult = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='seeding_metadata'
    `)
    
    if (seedingTableResult.rows.length > 0) {
      console.log('\n✅ seeding_metadata table exists')
    } else {
      console.log('\n❌ seeding_metadata table not found')
    }
    
    console.log('\n✨ Migration process completed!')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await db.close()
  }
}

// Run the migration
applyMigration().catch(console.error)