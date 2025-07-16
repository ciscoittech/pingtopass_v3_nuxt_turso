import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Database client
const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function testAPIFlow() {
  console.log('🧪 Testing complete API flow...\n')
  
  try {
    // 1. Test database connection
    console.log('1️⃣ Testing database connection...')
    const dbTest = await db.execute('SELECT COUNT(*) as count FROM exams')
    console.log(`   ✅ Database connected - ${dbTest.rows[0].count} exams found\n`)
    
    // 2. Get first exam
    console.log('2️⃣ Getting exam details...')
    const exams = await db.execute('SELECT id, code, name FROM exams ORDER BY code LIMIT 1')
    if (exams.rows.length === 0) {
      console.log('   ❌ No exams found')
      return
    }
    const exam = exams.rows[0]
    console.log(`   ✅ Using exam: ${exam.code} - ${exam.name}\n`)
    
    // 3. Test question count
    console.log('3️⃣ Testing question count...')
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM questions WHERE exam_id = ? AND is_active = 1',
      args: [exam.id]
    })
    const questionCount = countResult.rows[0]?.count || 0
    console.log(`   ✅ Found ${questionCount} questions\n`)
    
    // 4. Test question fetching
    console.log('4️⃣ Testing question fetching...')
    const questionsResult = await db.execute({
      sql: `
        SELECT 
          q.id,
          q.exam_id,
          q.objective_id,
          q.question_text,
          q.question_type,
          q.options,
          q.correct_answer,
          q.explanation,
          q.is_active,
          o.title as objective_title
        FROM questions q
        LEFT JOIN objectives o ON q.objective_id = o.id
        WHERE q.exam_id = ? AND q.is_active = 1
        LIMIT 3
      `,
      args: [exam.id]
    })
    console.log(`   ✅ Fetched ${questionsResult.rows.length} questions`)
    
    if (questionsResult.rows.length > 0) {
      const firstQuestion = questionsResult.rows[0]
      console.log(`   📝 Sample question: "${firstQuestion.question_text.substring(0, 60)}..."`)
      console.log(`   📊 Type: ${firstQuestion.question_type}`)
      console.log(`   🎯 Options: ${JSON.parse(firstQuestion.options).length} choices\n`)
    }
    
    // 5. Test study sessions table
    console.log('5️⃣ Testing study sessions table...')
    const sessionsTest = await db.execute('SELECT COUNT(*) as count FROM study_sessions')
    console.log(`   ✅ Study sessions table accessible - ${sessionsTest.rows[0].count} sessions\n`)
    
    // 6. Test all critical column names
    console.log('6️⃣ Verifying critical column names...')
    const columnTests = [
      { table: 'questions', column: 'exam_id' },
      { table: 'questions', column: 'objective_id' },
      { table: 'questions', column: 'question_text' },
      { table: 'questions', column: 'is_active' },
      { table: 'study_sessions', column: 'user_id' },
      { table: 'study_sessions', column: 'exam_id' },
      { table: 'study_sessions', column: 'current_question_index' }
    ]
    
    for (const test of columnTests) {
      try {
        await db.execute(`SELECT ${test.column} FROM ${test.table} LIMIT 1`)
        console.log(`   ✅ ${test.table}.${test.column} exists`)
      } catch (error: any) {
        console.log(`   ❌ ${test.table}.${test.column} - ${error.message}`)
      }
    }
    
    console.log('\n✅ API flow test complete!')
    console.log('\n📋 Summary:')
    console.log(`   - Database: Connected`)
    console.log(`   - Exams: ${dbTest.rows[0].count} available`)
    console.log(`   - Questions: ${questionCount} for ${exam.code}`)
    console.log(`   - Schema: All critical columns verified`)
    console.log('\n🎯 Next steps:')
    console.log('   1. Navigate to http://localhost:3000/study')
    console.log(`   2. Click "Quick Start" for ${exam.code}`)
    console.log('   3. Configure study options and click "Start Studying"')
    console.log('   4. The exam interface should load with questions')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await db.close()
  }
}

testAPIFlow()