import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function checkSchema() {
  const result = await db.execute('PRAGMA table_info(vendors)')
  console.log('Vendors table schema:')
  result.rows.forEach(row => {
    console.log(`  ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''}`)
  })
  await db.close()
}

checkSchema()