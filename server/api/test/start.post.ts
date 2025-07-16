import { z } from 'zod'
import { useDB } from '~/server/utils/db'
import { testSessions, questions, exams } from '~/server/database/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { generateId } from '~/server/utils/id'

const db = useDB()

const startTestSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  timeLimit: z.number().min(60).max(14400).optional(), // 1 min to 4 hours
  maxQuestions: z.number().min(1).max(500).optional(),
  questionTypes: z.array(z.string()).optional(),
  includeSections: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Validate request body
    const body = await readBody(event)
    const validatedData = startTestSchema.parse(body)

    const userId = session.user.id
    const { examId, timeLimit, maxQuestions, questionTypes, includeSections } = validatedData

    // Verify exam exists and get exam details
    const exam = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId))
      .get()

    if (!exam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exam not found'
      })
    }

    // Check if user has an active test session for this exam
    const existingActiveSession = await db
      .select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.userId, userId),
          eq(testSessions.examId, examId),
          eq(testSessions.status, 'active')
        )
      )
      .get()

    if (existingActiveSession) {
      // Return existing active session instead of creating new one
      const questionIdsArray = JSON.parse(existingActiveSession.questionIds)
      const currentQuestion = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionIdsArray[existingActiveSession.currentQuestionIndex || 0]))
        .get()

      // Get all questions for this session (using same questionIdsArray from above)
      const sessionQuestions = await db
        .select()
        .from(questions)
        .where(inArray(questions.id, questionIdsArray))

      // Preserve original order
      const orderedQuestions = questionIdsArray.map(id => 
        sessionQuestions.find(q => q.id === id)
      ).filter(Boolean)

      // Prepare questions without answers
      const questionsForClient = orderedQuestions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options ? JSON.parse(q.options) : [],
        codeBlock: q.codeBlock,
      }))

      return {
        success: true,
        data: {
          sessionId: existingActiveSession.id,
          examId: existingActiveSession.examId,
          totalQuestions: existingActiveSession.totalQuestions,
          duration: existingActiveSession.timeLimit,
          currentQuestionIndex: existingActiveSession.currentQuestionIndex || 0,
          timeRemaining: existingActiveSession.timeRemaining,
          startedAt: existingActiveSession.startedAt,
          questions: questionsForClient,
          isResuming: true
        }
      }
    }

    // Build question query - only get active questions
    let questionQuery = db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.examId, examId),
          eq(questions.isActive, 1) // isActive is an integer in the database
        )
      )

    // Apply filters if provided
    if (questionTypes && questionTypes.length > 0) {
      questionQuery = questionQuery.where(
        inArray(questions.questionType, questionTypes)
      )
    }

    // Get questions for the test
    const availableQuestions = await questionQuery

    if (availableQuestions.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No questions found for this exam'
      })
    }

    // Shuffle questions and limit if requested
    const shuffledQuestions = availableQuestions.sort(() => Math.random() - 0.5)
    const testQuestions = maxQuestions 
      ? shuffledQuestions.slice(0, Math.min(maxQuestions, shuffledQuestions.length))
      : shuffledQuestions

    // Calculate time limit (default from exam or provided)
    const testTimeLimit = timeLimit || exam.timeLimit || 3600 // default 1 hour

    // Create test session
    const testSessionId = generateId('test')
    const timestamp = Math.floor(Date.now() / 1000)
    
    const newTestSession = {
      id: testSessionId,
      userId,
      examId,
      timeLimit: testTimeLimit,
      totalQuestions: testQuestions.length,
      questionIds: JSON.stringify(testQuestions.map(q => q.id)),
      status: 'active' as const,
      currentQuestionIndex: 0,
      answers: '{}',
      reviewFlags: '{}',
      startedAt: timestamp,
      timeRemaining: testTimeLimit,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    await db.insert(testSessions).values(newTestSession)

    // Get first question details
    const firstQuestion = testQuestions[0]

    // Prepare questions array WITHOUT correct answers for security
    const questionsForClient = testQuestions.map((q, index) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options ? JSON.parse(q.options) : [],
      codeBlock: q.codeBlock,
      // DO NOT include correctAnswer or explanation in test mode
    }))

    return {
      success: true,
      data: {
        sessionId: testSessionId,
        examId,
        examName: exam.name,
        examCode: exam.code,
        totalQuestions: testQuestions.length,
        duration: testTimeLimit, // Match what frontend expects
        currentQuestionIndex: 0,
        timeRemaining: testTimeLimit,
        startedAt: timestamp,
        questions: questionsForClient, // Return all questions WITHOUT answers
        isResuming: false
      }
    }

  } catch (error) {
    console.error('Start test error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
