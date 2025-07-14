import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function fixUserProgressTable() {
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })
  
  try {
    // Check table structure
    const result = await client.execute("PRAGMA table_info('user_progress')")
    console.log('User progress table structure:')
    result.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`)
    })
    
    // Check for columns used in progressCalculations.ts
    const columnsToCheck = [
      { name: 'total_time_spent', type: 'INTEGER', default: '0' },
      { name: 'total_study_sessions', type: 'INTEGER', default: '0' },
      { name: 'total_tests_taken', type: 'INTEGER', default: '0' },
      { name: 'current_accuracy', type: 'REAL', default: '0' },
      { name: 'mastery_level', type: 'TEXT', default: "'beginner'" },
      { name: 'weekly_goal', type: 'INTEGER', default: '0' },
      { name: 'weekly_progress', type: 'INTEGER', default: '0' },
      { name: 'total_questions_answered', type: 'INTEGER', default: '0' },
      { name: 'correct_answers', type: 'INTEGER', default: '0' },
      { name: 'incorrect_answers', type: 'INTEGER', default: '0' },
      { name: 'best_test_score', type: 'REAL', default: '0' },
      { name: 'last_updated', type: 'INTEGER' },
      { name: 'first_study_date', type: 'INTEGER' }
    ]
    
    for (const column of columnsToCheck) {
      const exists = result.rows.some(row => row.name === column.name)
      if (!exists) {
        console.log(`\nAdding ${column.name} column to user_progress table...`)
        const defaultClause = column.default ? ` DEFAULT ${column.default}` : ''
        await client.execute(`ALTER TABLE user_progress ADD COLUMN ${column.name} ${column.type}${defaultClause}`)
        console.log(`✅ Added ${column.name} column`)
      }
    }
    
    console.log('\n✅ user_progress table structure fixed!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixUserProgressTable()