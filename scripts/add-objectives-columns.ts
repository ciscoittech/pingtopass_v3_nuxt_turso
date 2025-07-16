import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function addObjectivesColumns() {
  // Get database URL from environment
  const dbUrl = process.env.TURSO_DB_URL || process.env.NUXT_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_DB_TOKEN || process.env.NUXT_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
  
  if (!dbUrl || !authToken) {
    throw new Error('Database credentials not found in environment variables')
  }
  
  // Create database connection
  const client = createClient({
    url: dbUrl,
    authToken: authToken
  })
  
  const db = drizzle(client)
  
  try {
    console.log('Adding missing columns to objectives table...')
    
    // Add order column
    try {
      await db.run(sql`ALTER TABLE objectives ADD COLUMN "order" INTEGER NOT NULL DEFAULT 1`)
      console.log('✅ Added order column')
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  order column already exists')
      } else {
        throw error
      }
    }
    
    // Add is_active column
    try {
      await db.run(sql`ALTER TABLE objectives ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`)
      console.log('✅ Added is_active column')
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  is_active column already exists')
      } else {
        throw error
      }
    }
    
    // Update existing objectives to have sequential order
    const result = await db.run(sql`
      SELECT id, exam_id 
      FROM objectives 
      ORDER BY exam_id, created_at
    `)
    
    const objectives = result.rows as any[]
    
    if (objectives && objectives.length > 0) {
      let currentExamId = null
      let orderCounter = 1
      
      for (const obj of objectives) {
        if (obj.exam_id !== currentExamId) {
          currentExamId = obj.exam_id
          orderCounter = 1
        }
        
        await db.run(sql`
          UPDATE objectives 
          SET "order" = ${orderCounter} 
          WHERE id = ${obj.id}
        `)
        
        orderCounter++
      }
      
      console.log(`✅ Updated order for ${objectives.length} existing objectives`)
    }
    
    console.log('✅ Successfully added missing columns to objectives table')
    
  } catch (error) {
    console.error('❌ Error adding columns:', error)
    throw error
  } finally {
    // Close the connection
    client.close()
  }
}

// Run the migration
addObjectivesColumns()
  .then(() => {
    console.log('Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })