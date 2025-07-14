import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function fixUserStreaksTable() {
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })
  
  try {
    // Check table structure
    const result = await client.execute("PRAGMA table_info('user_streaks')")
    console.log('User streaks table structure:')
    result.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`)
    })
    
    // Check and add missing columns
    const hasLastStudyDate = result.rows.some(row => row.name === 'last_study_date')
    if (!hasLastStudyDate) {
      console.log('\nAdding last_study_date column to user_streaks table...')
      await client.execute('ALTER TABLE user_streaks ADD COLUMN last_study_date INTEGER')
      console.log('✅ Added last_study_date column')
    }
    
    // Check for other potentially missing columns from progressCalculations.ts
    const columnsToCheck = [
      { name: 'current_daily_streak', type: 'INTEGER', default: '0' },
      { name: 'longest_daily_streak', type: 'INTEGER', default: '0' },
      { name: 'current_answer_streak', type: 'INTEGER', default: '0' },
      { name: 'longest_answer_streak', type: 'INTEGER', default: '0' },
      { name: 'perfect_score_streak', type: 'INTEGER', default: '0' },
      { name: 'longest_perfect_streak', type: 'INTEGER', default: '0' },
      { name: 'last_correct_answer', type: 'INTEGER' },
      { name: 'updated_at', type: 'INTEGER' },
      { name: 'achievements', type: 'TEXT' },
      { name: 'total_points', type: 'INTEGER', default: '0' },
      { name: 'level', type: 'INTEGER', default: '1' }
    ]
    
    for (const column of columnsToCheck) {
      const exists = result.rows.some(row => row.name === column.name)
      if (!exists) {
        console.log(`\nAdding ${column.name} column to user_streaks table...`)
        const defaultClause = column.default ? ` DEFAULT ${column.default}` : ''
        await client.execute(`ALTER TABLE user_streaks ADD COLUMN ${column.name} ${column.type}${defaultClause}`)
        console.log(`✅ Added ${column.name} column`)
      }
    }
    
    console.log('\n✅ user_streaks table structure fixed!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixUserStreaksTable()