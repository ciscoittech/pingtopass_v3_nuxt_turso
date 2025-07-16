import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../server/database/schema'
import { generateId } from '../server/utils/id'
import { eq } from 'drizzle-orm'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function seedSessionData() {
  // Create database connection
  const client = createClient({
    url: process.env.TURSO_DB_URL || process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_DB_TOKEN || process.env.TURSO_AUTH_TOKEN || ''
  })
  
  const db = drizzle(client, { schema })
  
  console.log('🌱 Seeding session data...\n')
  
  try {
    // Get a sample user and exam
    const user = await db.select().from(schema.users).limit(1).get()
    const exam = await db.select().from(schema.exams).where(eq(schema.exams.code, 'N10-008')).get()
    
    if (!user || !exam) {
      console.error('❌ No user or exam found for seeding')
      return
    }
    
    // Get questions for the exam
    const questions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.examId, exam.id))
      .limit(10)
    
    if (questions.length === 0) {
      console.error('❌ No questions found for exam')
      return
    }
    
    const questionIds = questions.map(q => q.id)
    const currentTime = Math.floor(Date.now() / 1000)
    
    // Create an active study session
    const studySessionId = generateId('study')
    await db.insert(schema.studySessions).values({
      id: studySessionId,
      userId: user.id,
      examId: exam.id,
      status: 'active',
      mode: 'sequential',
      currentQuestionIndex: 3,
      totalQuestions: questions.length,
      correctAnswers: 2,
      incorrectAnswers: 1,
      skippedAnswers: 0,
      questionsOrder: JSON.stringify(questionIds),
      answers: JSON.stringify({
        [questionIds[0]]: {
          questionId: questionIds[0],
          selectedAnswers: [0],
          isCorrect: true,
          timeSpent: 45,
          answeredAt: new Date().toISOString()
        },
        [questionIds[1]]: {
          questionId: questionIds[1],
          selectedAnswers: [1],
          isCorrect: false,
          timeSpent: 30,
          answeredAt: new Date().toISOString()
        },
        [questionIds[2]]: {
          questionId: questionIds[2],
          selectedAnswers: [2],
          isCorrect: true,
          timeSpent: 60,
          answeredAt: new Date().toISOString()
        }
      }),
      bookmarks: JSON.stringify([questionIds[1]]),
      flags: JSON.stringify([]),
      startedAt: currentTime - 600, // Started 10 minutes ago
      lastActivityAt: currentTime - 30, // Last activity 30 seconds ago
      timeSpentSeconds: 570,
      showExplanations: 1,
      showTimer: 1,
      autoAdvance: 0
    })
    
    console.log('✅ Created active study session:', studySessionId)
    
    // Create a completed study session
    const completedStudyId = generateId('study')
    await db.insert(schema.studySessions).values({
      id: completedStudyId,
      userId: user.id,
      examId: exam.id,
      status: 'completed',
      mode: 'random',
      currentQuestionIndex: questions.length,
      totalQuestions: questions.length,
      correctAnswers: 7,
      incorrectAnswers: 3,
      skippedAnswers: 0,
      questionsOrder: JSON.stringify(questionIds),
      answers: JSON.stringify(
        questionIds.reduce((acc, qId, idx) => {
          acc[qId] = {
            questionId: qId,
            selectedAnswers: [idx % 4],
            isCorrect: idx < 7,
            timeSpent: 30 + (idx * 10),
            answeredAt: new Date(Date.now() - (1000 * 60 * (10 - idx))).toISOString()
          }
          return acc
        }, {} as any)
      ),
      bookmarks: JSON.stringify([]),
      flags: JSON.stringify([questionIds[5], questionIds[8]]),
      startedAt: currentTime - 3600,
      lastActivityAt: currentTime - 1800,
      completedAt: currentTime - 1800,
      timeSpentSeconds: 1800,
      showExplanations: 1,
      showTimer: 1,
      autoAdvance: 0
    })
    
    console.log('✅ Created completed study session:', completedStudyId)
    
    // Create an active test session
    const testSessionId = generateId('test')
    await db.insert(schema.testSessions).values({
      id: testSessionId,
      userId: user.id,
      examId: exam.id,
      status: 'active',
      timeLimitSeconds: 5400, // 90 minutes
      totalQuestions: questions.length,
      passingScore: 70,
      currentQuestionIndex: 5,
      answeredCount: 4,
      flaggedCount: 2,
      questionsOrder: JSON.stringify(questionIds),
      answers: JSON.stringify({
        0: [1],
        1: [2],
        3: [0],
        4: [3]
      }),
      flagged: JSON.stringify([1, 3]),
      startedAt: currentTime - 900, // Started 15 minutes ago
      lastActivityAt: currentTime - 10,
      timeRemainingSeconds: 4500,
      lastAutoSaveAt: currentTime - 60,
      autoSaveCount: 5
    })
    
    console.log('✅ Created active test session:', testSessionId)
    
    // Create a submitted test session
    const submittedTestId = generateId('test')
    await db.insert(schema.testSessions).values({
      id: submittedTestId,
      userId: user.id,
      examId: exam.id,
      status: 'submitted',
      timeLimitSeconds: 5400,
      totalQuestions: questions.length,
      passingScore: 70,
      currentQuestionIndex: questions.length,
      answeredCount: questions.length - 1,
      flaggedCount: 0,
      questionsOrder: JSON.stringify(questionIds),
      answers: JSON.stringify(
        questionIds.reduce((acc, _, idx) => {
          if (idx < questions.length - 1) {
            acc[idx] = [idx % 4]
          }
          return acc
        }, {} as any)
      ),
      flagged: JSON.stringify([]),
      startedAt: currentTime - 7200,
      lastActivityAt: currentTime - 5400,
      submittedAt: currentTime - 5400,
      timeRemainingSeconds: 1800,
      score: 75.5,
      correctCount: 8,
      incorrectCount: 1,
      unansweredCount: 1,
      passed: 1,
      lastAutoSaveAt: currentTime - 5410,
      autoSaveCount: 15
    })
    
    console.log('✅ Created submitted test session:', submittedTestId)
    
    console.log('\n✨ Session seeding completed!')
    
  } catch (error) {
    console.error('❌ Error seeding sessions:', error)
  }
  
  process.exit(0)
}

seedSessionData().catch(console.error)