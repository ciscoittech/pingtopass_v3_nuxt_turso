import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../server/database/schema'
import { eq, and, sql } from 'drizzle-orm'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function verifyN10008() {
  // Create database connection
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || ''
  })
  
  const db = drizzle(client, { schema })
  
  console.log('🔍 Verifying N10-008 exam data...\n')
  
  // Check if exam exists
  const exam = await db
    .select()
    .from(schema.exams)
    .where(eq(schema.exams.code, 'N10-008'))
    .get()
    
  if (!exam) {
    console.error('❌ Exam N10-008 not found!')
    process.exit(1)
  }
  
  console.log('✅ Found exam:', {
    id: exam.id,
    code: exam.code,
    name: exam.name,
    isActive: exam.isActive
  })
  
  // Count questions
  const questionCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.questions)
    .where(eq(schema.questions.examId, exam.id))
    .get()
    
  console.log(`\n📝 Total Questions: ${questionCount?.count || 0}`)
  
  // Count active questions
  const activeQuestionCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.questions)
    .where(
      and(
        eq(schema.questions.examId, exam.id),
        eq(schema.questions.isActive, 1)
      )
    )
    .get()
    
  console.log(`📝 Active Questions: ${activeQuestionCount?.count || 0}`)
  
  // Count objectives
  const objectiveCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.objectives)
    .where(eq(schema.objectives.examId, exam.id))
    .get()
    
  console.log(`🎯 Objectives: ${objectiveCount?.count || 0}`)
  
  // Get sample questions
  const sampleQuestions = await db
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.examId, exam.id))
    .limit(3)
    
  console.log('\n📚 Sample Questions:')
  sampleQuestions.forEach((q, i) => {
    console.log(`\n${i + 1}. ${q.questionText.substring(0, 100)}...`)
    console.log(`   Type: ${q.questionType || 'not set'}, Active: ${q.isActive}`)
    console.log(`   Options: ${q.options ? 'Yes' : 'No'}, CorrectAnswer: ${q.correctAnswer ? 'Yes' : 'No'}`)
  })
  
  // Test API endpoints
  console.log('\n🔗 Testing API endpoints:')
  console.log(`- Study mode: http://localhost:3000/study/N10-008`)
  console.log(`- Test mode: http://localhost:3000/test/N10-008`)
  console.log(`- Direct exam ID: http://localhost:3000/study/${exam.id}`)
  
  process.exit(0)
}

verifyN10008().catch(console.error)