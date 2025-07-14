import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function testDatabaseSetup() {
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })
  
  try {
    console.log('🧪 Testing database setup...\n')
    
    // Test vendors
    const vendors = await client.execute('SELECT COUNT(*) as count FROM vendors')
    console.log(`✅ Vendors table: ${vendors.rows[0].count} records`)
    
    // Test exams
    const exams = await client.execute('SELECT COUNT(*) as count FROM exams')
    console.log(`✅ Exams table: ${exams.rows[0].count} records`)
    
    // Test objectives
    const objectives = await client.execute('SELECT COUNT(*) as count FROM objectives')
    console.log(`✅ Objectives table: ${objectives.rows[0].count} records`)
    
    // Test questions
    const questions = await client.execute('SELECT COUNT(*) as count FROM questions')
    console.log(`✅ Questions table: ${questions.rows[0].count} records`)
    
    // Test sample question
    const sampleQuestion = await client.execute(`
      SELECT q.*, o.title as objective_title, e.name as exam_name
      FROM questions q
      JOIN objectives o ON q.objective_id = o.id
      JOIN exams e ON q.exam_id = e.id
      LIMIT 1
    `)
    
    if (sampleQuestion.rows.length > 0) {
      const q = sampleQuestion.rows[0]
      console.log('\n📝 Sample question:')
      console.log(`  Exam: ${q.exam_name}`)
      console.log(`  Objective: ${q.objective_title}`)
      console.log(`  Question: ${q.question_text?.toString().substring(0, 100)}...`)
      console.log(`  Options: ${q.options}`)
      console.log(`  Answer: ${q.correct_answer}`)
    }
    
    // Test user tables structure
    console.log('\n🏗️  Checking user tables structure...')
    const tables = ['users', 'user_progress', 'user_streaks', 'study_activity']
    
    for (const table of tables) {
      try {
        const result = await client.execute(`SELECT COUNT(*) as count FROM ${table}`)
        console.log(`✅ ${table} table exists (${result.rows[0].count} records)`)
      } catch (error: any) {
        console.log(`❌ ${table} table: ${error.message}`)
      }
    }
    
    console.log('\n✅ Database setup complete!')
    
  } catch (error) {
    console.error('❌ Error testing database:', error)
  }
}

testDatabaseSetup()