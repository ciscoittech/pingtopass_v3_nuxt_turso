import { testSessionService } from '~/server/utils/sessions'
import { questionService } from '~/server/utils/questionService'
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
    // Get session to verify ownership
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
    
    // Check if already submitted
    if (session.status === 'submitted') {
      // Return existing results
      const results = await testSessionService.getResults(sessionId)
      return {
        success: true,
        data: results
      }
    }
    
    // Check if session is expired
    if (session.status === 'expired') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot submit an expired test session'
      })
    }
    
    // Submit the test
    await testSessionService.submit(sessionId)
    
    // Get all questions with answers for scoring
    const questions = await questionService.getByIds(
      session.questionsOrder,
      true // Include correct answers for scoring
    )
    
    // Create question map for easy lookup
    const questionMap = new Map(questions.map(q => [q.id, q]))
    
    // Calculate results
    let correctCount = 0
    let incorrectCount = 0
    let unansweredCount = 0
    const detailedResults = []
    
    // Process each question
    for (let i = 0; i < session.questionsOrder.length; i++) {
      const questionId = session.questionsOrder[i]
      const question = questionMap.get(questionId)
      const userAnswer = session.answers[questionId]
      
      if (!question) continue
      
      const result: any = {
        questionId: question.id,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        objectiveTitle: question.objectiveTitle
      }
      
      if (userAnswer) {
        result.userAnswer = userAnswer.selectedAnswers
        result.isCorrect = questionService.validateAnswer(question, userAnswer.selectedAnswers)
        result.timeSpent = userAnswer.timeSpent || 0
        
        if (result.isCorrect) {
          correctCount++
        } else {
          incorrectCount++
        }
      } else {
        result.userAnswer = []
        result.isCorrect = false
        unansweredCount++
      }
      
      detailedResults.push(result)
    }
    
    // Calculate score
    const totalQuestions = session.totalQuestions
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0
    const passed = score >= session.passingScore
    
    // Calculate time spent
    const now = Math.floor(Date.now() / 1000)
    const timeSpent = Math.min(now - session.startedAt, session.timeLimitSeconds)
    
    // Update session with final score
    await testSessionService.updateScore(sessionId, {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      correctCount,
      incorrectCount,
      unansweredCount,
      timeSpentSeconds: timeSpent
    })
    
    // Get final session state
    const finalSession = await testSessionService.getById(sessionId)
    
    console.log(`[Test Session] Submitted session ${sessionId} for user ${user.id} - Score: ${score}% (${passed ? 'PASS' : 'FAIL'})`)
    
    // Return results
    const results = {
      session: finalSession,
      results: {
        score: Math.round(score * 100) / 100,
        passed,
        correctCount,
        incorrectCount,
        unansweredCount,
        totalQuestions,
        passingScore: session.passingScore,
        timeSpent,
        detailedResults
      }
    }
    
    return {
      success: true,
      data: results
    }
  } catch (error: any) {
    console.error('Failed to submit test session:', error)
    
    // Re-throw if it's already a proper error
    if (error.statusCode) throw error
    
    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to submit test session'
    })
  }
})