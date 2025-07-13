import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function checkVendorsTable() {
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })

  try {
    // Check vendors table structure
    const columns = await client.execute(`
      PRAGMA table_info(vendors);
    `)
    
    console.log('Vendors table columns:')
    columns.rows.forEach(row => {
      console.log(`- ${row.name} (${row.type})`)
    })

    // Get sample data
    const vendors = await client.execute('SELECT * FROM vendors LIMIT 5')
    console.log('\nSample vendors:')
    vendors.rows.forEach(row => {
      console.log(row)
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

checkVendorsTable()