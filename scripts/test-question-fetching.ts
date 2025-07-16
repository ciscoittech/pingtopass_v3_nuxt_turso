import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Database client
const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function testQuestionFetching() {
  console.log('🧪 Testing question fetching...\n')
  
  try {
    // Get first exam
    const exams = await db.execute('SELECT id, code, name FROM exams ORDER BY code LIMIT 1')
    
    if (exams.rows.length === 0) {
      console.log('❌ No exams found')
      return
    }
    
    const exam = exams.rows[0]
    console.log(`Testing with exam: ${exam.code} (${exam.id})`)
    
    // Test raw SQL query like questionService does
    const result = await db.execute({
      sql: `
        SELECT 
          q.id,
          q.exam_id,
          q.objective_id,
          q.question_text,
          q.question_type,
          q.options,
          q.correct_answer,
          q.explanation,
          q.is_active,
          o.title as objective_title
        FROM questions q
        LEFT JOIN objectives o ON q.objective_id = o.id
        WHERE q.exam_id = ? AND q.is_active = 1
        LIMIT 5
      `,
      args: [exam.id]
    })
    
    console.log(`\nFound ${result.rows.length} questions:`)
    
    result.rows.forEach((row: any, idx: number) => {
      console.log(`\nQuestion ${idx + 1}:`)
      console.log(`  ID: ${row.id}`)
      console.log(`  Text: ${row.question_text.substring(0, 80)}...`)
      console.log(`  Type: ${row.question_type}`)
      console.log(`  Options: ${row.options ? JSON.parse(row.options).length : 0} options`)
      console.log(`  Objective: ${row.objective_title || 'N/A'}`)
    })
    
    console.log('\n✅ Test complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testQuestionFetching()