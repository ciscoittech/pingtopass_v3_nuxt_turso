import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function checkExamsTable() {
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })

  try {
    // Check exams table structure
    const columns = await client.execute(`
      PRAGMA table_info(exams);
    `)
    
    console.log('Exams table columns:')
    columns.rows.forEach(row => {
      console.log(`- ${row.name} (${row.type})`)
    })

    // Get sample data
    const exams = await client.execute('SELECT * FROM exams LIMIT 2')
    console.log('\nSample exams:')
    exams.rows.forEach(row => {
      console.log(row)
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

checkExamsTable()