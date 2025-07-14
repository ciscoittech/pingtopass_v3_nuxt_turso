import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function checkExamData() {
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })
  
  try {
    // Check exams
    const examsResult = await client.execute('SELECT id, code, name FROM exams LIMIT 10')
    console.log(`Found ${examsResult.rows.length} exams:`)
    examsResult.rows.forEach(row => {
      console.log(`  - ${row.id}: ${row.code} - ${row.name}`)
    })
    
    // Check vendors
    const vendorsResult = await client.execute('SELECT id, name FROM vendors LIMIT 10')
    console.log(`\nFound ${vendorsResult.rows.length} vendors:`)
    vendorsResult.rows.forEach(row => {
      console.log(`  - ${row.id}: ${row.name}`)
    })
    
    // Check questions count
    const questionsResult = await client.execute('SELECT COUNT(*) as count FROM questions')
    console.log(`\nTotal questions: ${questionsResult.rows[0].count}`)
    
  } catch (error) {
    console.error('Error checking data:', error)
  }
}

checkExamData()