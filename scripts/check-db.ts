import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function checkDatabase() {
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })

  try {
    // Check what tables exist
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `)
    
    console.log('Existing tables:')
    tables.rows.forEach(row => {
      console.log(`- ${row.name}`)
    })

    // Check if vendors table exists and has data
    const vendors = await client.execute('SELECT COUNT(*) as count FROM vendors')
    console.log(`\nVendors count: ${vendors.rows[0].count}`)

    // Check if exams table exists and has data
    const exams = await client.execute('SELECT COUNT(*) as count FROM exams')
    console.log(`Exams count: ${exams.rows[0].count}`)

  } catch (error) {
    console.error('Error:', error)
  }
}

checkDatabase()