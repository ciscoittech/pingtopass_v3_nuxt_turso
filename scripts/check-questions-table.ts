import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function checkQuestionsTable() {
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })
  
  try {
    // Check table structure
    const result = await client.execute("PRAGMA table_info('questions')")
    console.log('Questions table structure:')
    result.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`)
    })
    
    // Check if we need to add exam_id column
    const hasExamId = result.rows.some(row => row.name === 'exam_id')
    if (!hasExamId) {
      console.log('\nAdding exam_id column to questions table...')
      await client.execute('ALTER TABLE questions ADD COLUMN exam_id TEXT')
      console.log('✅ Added exam_id column')
    }
    
    // Check if we need to add options column
    const hasOptions = result.rows.some(row => row.name === 'options')
    if (!hasOptions) {
      console.log('\nAdding options column to questions table...')
      await client.execute('ALTER TABLE questions ADD COLUMN options TEXT')
      console.log('✅ Added options column')
    }
    
    // Check if we need to add correct_answer column
    const hasCorrectAnswer = result.rows.some(row => row.name === 'correct_answer')
    if (!hasCorrectAnswer) {
      console.log('\nAdding correct_answer column to questions table...')
      await client.execute('ALTER TABLE questions ADD COLUMN correct_answer TEXT')
      console.log('✅ Added correct_answer column')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkQuestionsTable()