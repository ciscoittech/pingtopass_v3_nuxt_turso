import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Database client
const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function testQuestionCounts() {
  console.log('🧪 Testing question counts...\n')
  
  try {
    // Get all exams
    const exams = await db.execute('SELECT id, code, name FROM exams ORDER BY code')
    
    for (const exam of exams.rows) {
      // Count questions for each exam
      const result = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM questions WHERE exam_id = ? AND is_active = 1',
        args: [exam.id]
      })
      
      const count = result.rows[0]?.count || 0
      console.log(`${exam.code} (${exam.id}): ${count} questions`)
    }
    
    console.log('\n✅ Test complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testQuestionCounts()