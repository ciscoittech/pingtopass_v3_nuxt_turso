import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function testN10008() {
  try {
    // Find N10-008 exam
    console.log('Finding N10-008 exam...')
    const n10008 = await db.execute("SELECT * FROM exams WHERE code = 'N10-008'")
    if (n10008.rows.length > 0) {
      console.log('Found N10-008:', n10008.rows[0])
      const examId = n10008.rows[0].id
      
      // Check if there are questions for this exam
      console.log('\nChecking questions for exam ID:', examId)
      const questions = await db.execute(`SELECT COUNT(*) as count FROM questions WHERE exam_id = '${examId}'`)
      console.log('Number of questions:', questions.rows[0].count)
      
      // Get a sample question
      if (questions.rows[0].count > 0) {
        const sampleQuestion = await db.execute(`SELECT * FROM questions WHERE exam_id = '${examId}' LIMIT 1`)
        console.log('\nSample question:', sampleQuestion.rows[0])
      }
      
      // Check objectives
      console.log('\nChecking objectives...')
      const objectives = await db.execute(`SELECT * FROM objectives WHERE exam_id = '${examId}'`)
      console.log('Number of objectives:', objectives.rows.length)
      if (objectives.rows.length > 0) {
        console.log('Sample objective:', objectives.rows[0])
      }
    } else {
      console.log('N10-008 not found!')
    }
    
    await db.close()
  } catch (error) {
    console.error('Error:', error)
    await db.close()
  }
}

testN10008()