import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function checkSchema() {
  try {
    const questionsSchema = await db.execute('PRAGMA table_info(questions)')
    console.log('Questions table schema:')
    questionsSchema.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`)
    })
    
    await db.close()
  } catch (error) {
    console.error('Error:', error)
    await db.close()
  }
}

checkSchema()