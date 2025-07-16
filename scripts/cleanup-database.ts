import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Database client
const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...')
  
  try {
    // Disable foreign key checks temporarily
    await db.execute('PRAGMA foreign_keys = OFF')
    
    // Delete in reverse order of dependencies
    try {
      console.log('Cleaning study sessions...')
      const studySessionsResult = await db.execute('DELETE FROM study_sessions')
      console.log(`✓ Deleted ${studySessionsResult.rowsAffected} study sessions`)
    } catch (e) {
      console.log('  ⚠️  No study_sessions table or already empty')
    }
    
    try {
      console.log('Cleaning test sessions...')
      const testSessionsResult = await db.execute('DELETE FROM test_sessions')
      console.log(`✓ Deleted ${testSessionsResult.rowsAffected} test sessions`)
    } catch (e) {
      console.log('  ⚠️  No test_sessions table or already empty')
    }
    
    try {
      console.log('Cleaning user progress...')
      const progressResult = await db.execute('DELETE FROM user_progress')
      console.log(`✓ Deleted ${progressResult.rowsAffected} progress records`)
    } catch (e) {
      console.log('  ⚠️  No user_progress table or already empty')
    }
    
    try {
      console.log('Cleaning bookmarks...')
      const bookmarksResult = await db.execute('DELETE FROM bookmarks')
      console.log(`✓ Deleted ${bookmarksResult.rowsAffected} bookmarks`)
    } catch (e) {
      console.log('  ⚠️  No bookmarks table or already empty')
    }
    
    console.log('Deleting questions...')
    const questionsResult = await db.execute('DELETE FROM questions')
    console.log(`✓ Deleted ${questionsResult.rowsAffected} questions`)
    
    console.log('Deleting objectives...')
    const objectivesResult = await db.execute('DELETE FROM objectives')
    console.log(`✓ Deleted ${objectivesResult.rowsAffected} objectives`)
    
    console.log('Deleting exams...')
    const examsResult = await db.execute('DELETE FROM exams')
    console.log(`✓ Deleted ${examsResult.rowsAffected} exams`)
    
    console.log('Deleting vendors...')
    const vendorsResult = await db.execute('DELETE FROM vendors')
    console.log(`✓ Deleted ${vendorsResult.rowsAffected} vendors`)
    
    try {
      console.log('Cleaning seeding metadata...')
      const seedingResult = await db.execute('DELETE FROM seeding_metadata')
      console.log(`✓ Deleted ${seedingResult.rowsAffected} seeding records`)
    } catch (e) {
      console.log('  ⚠️  No seeding_metadata table or already empty')
    }
    
    // Re-enable foreign key checks
    await db.execute('PRAGMA foreign_keys = ON')
    
    console.log('✅ Database cleanup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    // Try to re-enable foreign keys even on error
    try {
      await db.execute('PRAGMA foreign_keys = ON')
    } catch (e) {}
    throw error
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to cleanup database:', error)
    process.exit(1)
  })