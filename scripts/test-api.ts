import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function testApi() {
  console.log('Testing API data...\n')

  // Check exams
  const examsResult = await db.execute(`
    SELECT e.id, e.vendor_id, e.code, e.name, e.description, e.is_active, v.name as vendor_name
    FROM exams e
    LEFT JOIN vendors v ON e.vendor_id = v.id
    WHERE e.is_active = 1
    LIMIT 5
  `)
  
  console.log('Sample Exams:')
  examsResult.rows.forEach(exam => {
    console.log(`- ${exam.code}: ${exam.name} (Vendor: ${exam.vendor_name})`)
  })
  
  // Check objectives for first exam
  if (examsResult.rows.length > 0) {
    const firstExamId = examsResult.rows[0].id
    console.log(`\nObjectives for exam ${firstExamId}:`)
    
    const objResult = await db.execute({
      sql: 'SELECT * FROM objectives WHERE exam_id = ? LIMIT 5',
      args: [firstExamId]
    })
    
    objResult.rows.forEach(obj => {
      console.log(`- ${obj.title}`)
    })
  }
  
  await db.close()
}

testApi()