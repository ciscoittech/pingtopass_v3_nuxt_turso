import { useDB } from '~/server/utils/db'
import { studySessions, questions, exams, objectives } from '~/server/database/schema'
import { eq, and, sql } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

interface WeakArea {
  objectiveId: string
  objectiveTitle: string
  examId: string
  examCode: string
  examName: string
  totalQuestions: number
  incorrectAnswers: number
  accuracy: number
  lastAttempt: number
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  try {
    const db = useDB()
    
    // Get all study sessions for the user
    const sessions = await db
      .select({
        examId: studySessions.examId,
        answers: studySessions.answers,
        updatedAt: studySessions.updatedAt
      })
      .from(studySessions)
      .where(eq(studySessions.userId, user.id))
    
    // Process answers to identify weak areas by objective
    const objectiveStats = new Map<string, {
      examId: string
      totalQuestions: number
      correctAnswers: number
      lastAttempt: number
      questionIds: Set<string>
    }>()
    
    // Parse all answers and group by objective
    for (const session of sessions) {
      if (!session.answers) continue
      
      let answers: Record<string, any>
      try {
        answers = JSON.parse(session.answers) as Record<string, {
          questionId: string
          isCorrect: boolean
          answeredAt: string
        }>
      } catch (e) {
        console.error('[Weak Areas] Failed to parse answers:', e)
        continue
      }
      
      // Get question details for each answered question
      const questionIds = Object.keys(answers)
      
      // Validate questionIds is an array
      if (!Array.isArray(questionIds)) {
        console.error('[Weak Areas] questionIds is not an array:', questionIds)
        continue
      }
      
      if (questionIds.length === 0) continue
      
      const questionsData = await db
        .select({
          id: questions.id,
          objectiveId: questions.objectiveId,
          examId: questions.examId
        })
        .from(questions)
        .where(sql`${questions.id} IN (${sql.raw(questionIds.map(id => `'${id}'`).join(','))})`)
      
      // Group by objective
      questionsData.forEach(question => {
        if (!question.objectiveId) return
        
        const key = `${question.examId}_${question.objectiveId}`
        const answer = answers[question.id]
        
        if (!objectiveStats.has(key)) {
          objectiveStats.set(key, {
            examId: question.examId,
            totalQuestions: 0,
            correctAnswers: 0,
            lastAttempt: 0,
            questionIds: new Set()
          })
        }
        
        const stats = objectiveStats.get(key)!
        if (!stats.questionIds.has(question.id)) {
          stats.questionIds.add(question.id)
          stats.totalQuestions++
          if (answer.isCorrect) {
            stats.correctAnswers++
          }
        }
        
        // Update last attempt time
        const attemptTime = new Date(answer.answeredAt).getTime() / 1000
        if (attemptTime > stats.lastAttempt) {
          stats.lastAttempt = attemptTime
        }
      })
    }
    
    // Get objective and exam details
    const weakAreas: WeakArea[] = []
    
    for (const [key, stats] of objectiveStats) {
      const [examId, objectiveId] = key.split('_')
      const accuracy = (stats.correctAnswers / stats.totalQuestions) * 100
      
      // Only include areas with accuracy below 70%
      if (accuracy < 70) {
        // Get objective and exam details
        const result = await db
          .select({
            objective: objectives,
            exam: exams
          })
          .from(objectives)
          .innerJoin(exams, eq(objectives.examId, exams.id))
          .where(eq(objectives.id, objectiveId))
          .get()
        
        if (result) {
          weakAreas.push({
            objectiveId,
            objectiveTitle: result.objective.title,
            examId,
            examCode: result.exam.code,
            examName: result.exam.name,
            totalQuestions: stats.totalQuestions,
            incorrectAnswers: stats.totalQuestions - stats.correctAnswers,
            accuracy,
            lastAttempt: stats.lastAttempt
          })
        }
      }
    }
    
    // Sort by accuracy (ascending) to show weakest areas first
    weakAreas.sort((a, b) => a.accuracy - b.accuracy)
    
    // Transform weak areas to match component expectations
    const transformedWeakAreas = weakAreas.map(area => ({
      objective: {
        id: area.objectiveId,
        title: area.objectiveTitle,
        description: `Practice questions from ${area.examName}`
      },
      performance: {
        accuracy: Math.round(area.accuracy),
        totalQuestions: area.totalQuestions,
        correctAnswers: area.totalQuestions - area.incorrectAnswers,
        averageTime: 45 // Default average time, would need to calculate from actual data
      },
      recommendation: {
        type: area.accuracy < 50 ? 'foundation' : 'improvement',
        message: area.accuracy < 50 
          ? 'Review fundamental concepts before practicing more questions'
          : 'Focus on understanding why certain answers are incorrect',
        action: `Practice ${area.incorrectAnswers} incorrect questions`
      }
    }))
    
    // Calculate overall performance
    const totalQuestions = weakAreas.reduce((sum, area) => sum + area.totalQuestions, 0)
    const totalCorrect = weakAreas.reduce((sum, area) => sum + (area.totalQuestions - area.incorrectAnswers), 0)
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    
    // Identify strong areas (accuracy >= 85%)
    const strongAreas = []
    for (const [key, stats] of objectiveStats) {
      const accuracy = (stats.correctAnswers / stats.totalQuestions) * 100
      if (accuracy >= 85 && stats.totalQuestions >= 5) {
        const [examId, objectiveId] = key.split('_')
        const result = await db
          .select({
            objective: objectives,
            exam: exams
          })
          .from(objectives)
          .innerJoin(exams, eq(objectives.examId, exams.id))
          .where(eq(objectives.id, objectiveId))
          .get()
        
        if (result) {
          strongAreas.push({
            objective: {
              id: objectiveId,
              title: result.objective.title
            },
            performance: {
              accuracy: Math.round(accuracy),
              totalQuestions: stats.totalQuestions
            }
          })
        }
      }
    }
    
    // Sort strong areas by accuracy
    strongAreas.sort((a, b) => b.performance.accuracy - a.performance.accuracy)
    
    // Generate focus plan
    const priority = overallAccuracy < 60 ? 'critical' : overallAccuracy < 75 ? 'improvement' : 'maintenance'
    const focusPlan = {
      priority,
      message: priority === 'critical' 
        ? 'Significant improvement needed across multiple areas'
        : priority === 'improvement'
        ? 'Good progress, but some areas need attention'
        : 'Excellent performance, maintain your study routine',
      recommendations: []
    }
    
    if (weakAreas.length > 3) {
      focusPlan.recommendations.push(`Focus on your ${Math.min(3, weakAreas.length)} weakest areas first`)
    }
    if (overallAccuracy < 70) {
      focusPlan.recommendations.push('Review course materials before attempting more questions')
    }
    focusPlan.recommendations.push('Use explanations to understand concepts, not just memorize answers')
    
    return {
      success: true,
      data: {
        overallPerformance: {
          accuracy: overallAccuracy,
          totalQuestions,
          timeSpent: totalQuestions * 45, // Rough estimate
          averageTime: 45
        },
        focusPlan,
        weakAreas: transformedWeakAreas,
        strongAreas: strongAreas.slice(0, 8) // Limit to top 8
      }
    }
  } catch (error: any) {
    console.error('Failed to analyze weak areas:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to analyze weak areas'
    })
  }
})