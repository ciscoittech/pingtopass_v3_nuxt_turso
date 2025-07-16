import { useDB } from '~/server/utils/db'
import { questions, users } from '~/server/database/schema'
import { generateId } from '~/server/utils/id'
import { eq, and } from 'drizzle-orm'

interface StartStudyRequest {
  examId: string
  studyMode?: 'sequential' | 'random' | 'flagged' | 'incorrect'
  maxQuestions?: number
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const body = await readBody<StartStudyRequest>(event)
  const db = useDB()

  if (!body.examId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Exam ID is required'
    })
  }

  try {
    // Get questions for the exam
    const examQuestions = await db
      .select({
        id: questions.id,
        examId: questions.examId,
        questionText: questions.questionText,
        questionType: questions.questionType,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation
      })
      .from(questions)
      .where(
        and(
          eq(questions.examId, body.examId),
          eq(questions.isActive, 1) // isActive is an integer in the database
        )
      )
      .all()

    if (!examQuestions.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No questions found for this exam'
      })
    }

    // Parse JSON fields
    const parsedQuestions = examQuestions.map(q => {
      try {
        return {
          ...q,
          options: q.options ? JSON.parse(q.options) : [],
          correctAnswer: q.correctAnswer ? JSON.parse(q.correctAnswer) : []
        }
      } catch (e) {
        console.warn('Invalid JSON in question:', q.id)
        return {
          ...q,
          options: [],
          correctAnswer: []
        }
      }
    })

    if (parsedQuestions.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No questions found for this exam'
      })
    }

    // Apply study mode logic
    let selectedQuestions = [...parsedQuestions]
    
    if (body.studyMode === 'random') {
      selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5)
    }
    
    if (body.maxQuestions && body.maxQuestions > 0) {
      selectedQuestions = selectedQuestions.slice(0, body.maxQuestions)
    }

    // Create study session
    const sessionId = generateId('study')
    const studySession = {
      id: sessionId,
      userId: session.user.id,
      examId: body.examId,
      studyMode: body.studyMode || 'sequential',
      totalQuestions: selectedQuestions.length,
      currentQuestionIndex: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      skippedAnswers: 0,
      startedAt: new Date().toISOString(),
      isCompleted: false,
      questionIds: JSON.stringify(selectedQuestions.map(q => q.id)),
      answers: JSON.stringify({}) // Store user answers
    }

    // Store session in database (you'll need to create the sessions table)
    // For now, store in memory or session storage
    await setUserSession(event, {
      ...session,
      studySession
    })

    // Prepare all questions for client (study mode includes answers/explanations)
    const questionsForClient = selectedQuestions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType || 'multiple-choice',
      options: q.options || [],
      correctAnswers: q.correctAnswer || [],
      explanation: q.explanation || '',
      codeBlock: q.codeBlock,
      resources: q.resources || []
    }))

    return {
      success: true,
      data: {
        sessionId,
        examId: body.examId,
        totalQuestions: selectedQuestions.length,
        currentQuestionIndex: 0,
        studyMode: body.studyMode || 'sequential',
        questions: questionsForClient,
        // Keep firstQuestion for backward compatibility
        firstQuestion: questionsForClient[0] || null
      }
    }

  } catch (error) {
    console.error('Error starting study session:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to start study session'
    })
  }
})