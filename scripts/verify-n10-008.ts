import { useDB } from '../server/utils/db'
import { exams, questions, objectives } from '../server/database/schema'
import { eq } from 'drizzle-orm'

async function verifyN10008() {
  const db = useDB()
  
  console.log('🔍 Verifying N10-008 exam data...\n')
  
  // Check if exam exists
  const exam = await db
    .select()
    .from(exams)
    .where(eq(exams.code, 'N10-008'))
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
    .from(questions)
    .where(eq(questions.examId, exam.id))
    .get()
    
  console.log(`\n📝 Questions: ${questionCount?.count || 0}`)
  
  // Count active questions
  const activeQuestionCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(
      and(
        eq(questions.examId, exam.id),
        eq(questions.isActive, 1)
      )
    )
    .get()
    
  console.log(`📝 Active Questions: ${activeQuestionCount?.count || 0}`)
  
  // Count objectives
  const objectiveCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(objectives)
    .where(eq(objectives.examId, exam.id))
    .get()
    
  console.log(`🎯 Objectives: ${objectiveCount?.count || 0}`)
  
  // Get sample questions
  const sampleQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, exam.id))
    .limit(3)
    
  console.log('\n📚 Sample Questions:')
  sampleQuestions.forEach((q, i) => {
    console.log(`\n${i + 1}. ${q.questionText.substring(0, 100)}...`)
    console.log(`   Type: ${q.questionType}, Active: ${q.isActive}`)
  })
  
  process.exit(0)
}

// Import sql
import { sql, and } from 'drizzle-orm'

verifyN10008().catch(console.error)