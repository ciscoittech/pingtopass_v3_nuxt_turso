import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function checkObjectivesTable() {
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })
  
  try {
    // Check table structure
    const result = await client.execute("PRAGMA table_info('objectives')")
    console.log('Objectives table structure:')
    result.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`)
    })
    
    // Add weight column if missing
    const hasWeight = result.rows.some(row => row.name === 'weight')
    if (!hasWeight) {
      console.log('\nAdding weight column to objectives table...')
      await client.execute('ALTER TABLE objectives ADD COLUMN weight REAL')
      console.log('✅ Added weight column')
    } else {
      console.log('\n✅ Weight column already exists')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkObjectivesTable()