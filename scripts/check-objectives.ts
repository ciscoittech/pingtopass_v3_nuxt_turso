import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function checkObjectives() {
  // First, let's see what objectives exist
  const allObjectives = await db.execute('SELECT COUNT(*) as count FROM objectives')
  console.log(`Total objectives in database: ${allObjectives.rows[0].count}`)
  
  // Check a few sample objectives
  const sampleObjectives = await db.execute('SELECT * FROM objectives LIMIT 5')
  console.log('\nSample objectives:')
  sampleObjectives.rows.forEach(obj => {
    console.log(`- Exam ID: ${obj.exam_id}, Title: ${obj.title}`)
  })
  
  // Check for AWS SAA exam
  const awsSaaExam = await db.execute({
    sql: 'SELECT * FROM exams WHERE code = ?',
    args: ['SAA-C03']
  })
  
  if (awsSaaExam.rows.length > 0) {
    const examId = awsSaaExam.rows[0].id
    console.log(`\nChecking objectives for AWS SAA (ID: ${examId}):`)
    
    const objectives = await db.execute({
      sql: 'SELECT * FROM objectives WHERE exam_id = ?',
      args: [examId]
    })
    
    console.log(`Found ${objectives.rows.length} objectives`)
    objectives.rows.forEach(obj => {
      console.log(`- ${obj.title}`)
    })
  }
  
  await db.close()
}

checkObjectives()