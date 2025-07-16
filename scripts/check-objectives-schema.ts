import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Database client
const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function checkObjectivesSchema() {
  try {
    console.log('🔍 Checking objectives table schema...\n')
    
    // Get the CREATE TABLE statement
    const schemaResult = await db.execute({
      sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name='objectives'",
      args: []
    })
    
    if (schemaResult.rows.length > 0) {
      console.log('Objectives table schema:')
      console.log(schemaResult.rows[0].sql)
      console.log('\n')
    }
    
    // Get column info
    const columnsResult = await db.execute({
      sql: "PRAGMA table_info('objectives')",
      args: []
    })
    
    console.log('Columns in objectives table:')
    columnsResult.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.close()
  }
}

checkObjectivesSchema().catch(console.error)