import { testSessionService } from '~/server/utils/sessions'
import { questionService } from '~/server/utils/questionService'
import { examService } from '~/server/utils/examService'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const sessionId = getRouterParam(event, 'id')
  
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }
  
  try {
    // Get session to verify ownership and status
    const session = await testSessionService.getById(sessionId)
    
    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Test session not found'
      })
    }
    
    // Verify ownership
    if (session.userId !== user.id && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied to this session'
      })
    }
    
    // Check if session has been submitted
    if (session.status !== 'submitted') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Test has not been submitted yet'
      })
    }
    
    // Get exam details
    const exam = await examService.getById(session.examId, user.id)
    if (!exam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exam not found'
      })
    }
    
    // Get query parameters
    const query = getQuery(event)
    const includeDetailedResults = query.detailed === 'true'
    
    // Calculate time spent
    const timeSpent = session.submittedAt ? session.submittedAt - session.startedAt : 0
    
    // Base response
    const response = {
      success: true,
      data: {
        sessionId: session.id,
        exam: {
          id: exam.id,
          name: exam.name,
          code: exam.code,
          description: exam.description
        },
        results: {
          totalScore: session.score || 0,
          maxPossibleScore: 100,
          scorePercentage: Math.round(session.score || 0),
          correctAnswers: session.correctCount || 0,
          incorrectAnswers: session.incorrectCount || 0,
          skippedAnswers: session.unansweredCount || 0,
          hasPassed: session.passed || false,
          passPercentage: session.passingScore,
          timeSpent,
          timeLimit: session.timeLimitSeconds,
          submittedAt: session.submittedAt,
          sectionScores: {} // Would need to implement objective-based scoring
        },
        detailedResults: null as any
      }
    }
    
    // Include detailed question-by-question results if requested
    if (includeDetailedResults) {
      // Get all questions with answers
      const questions = await questionService.getByIds(
        session.questionsOrder,
        true // Include correct answers
      )
      
      // Create question map for easy lookup
      const questionMap = new Map(questions.map(q => [q.id, q]))
      
      const detailedResults = session.questionsOrder.map((questionId, index) => {
        const question = questionMap.get(questionId)
        const userAnswer = session.answers[questionId]
        
        if (!question) {
          return null
        }
        
        const userSelectedAnswers = userAnswer?.selectedAnswers || []
        const isCorrect = userAnswer ? 
          questionService.validateAnswer(question, userSelectedAnswers) : 
          false
        const wasReviewed = session.flagged?.includes(questionId) || false
        
        return {
          questionNumber: index + 1,
          question: {
            id: question.id,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options,
            explanation: question.explanation,
            difficultyLevel: null // Not available in current schema
          },
          userAnswers: userSelectedAnswers,
          correctAnswers: question.correctAnswer || [],
          isCorrect,
          wasReviewed,
          wasSkipped: userSelectedAnswers.length === 0
        }
      }).filter(Boolean)
      
      response.data.detailedResults = detailedResults
    }
    
    return response
  } catch (error: any) {
    console.error('Failed to get test results:', error)
    
    // Re-throw if it's already a proper error
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve test results'
    })
  }
})