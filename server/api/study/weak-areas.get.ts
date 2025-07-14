import { useDB } from '~/server/utils/db'
import { studyActivity, exams, objectives } from '~/server/database/schema'
import { eq, desc, and, gte, sql } from 'drizzle-orm'

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

    const userId = session.user.id
    const query = getQuery(event)
    const examId = query.examId as string

    if (!examId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Exam ID is required'
      })
    }

    // Get recent activity for the exam (last 30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)
    
    const activities = await db
      .select()
      .from(studyActivity)
      .where(
        and(
          eq(studyActivity.userId, userId),
          eq(studyActivity.examId, examId),
          gte(studyActivity.timestamp, thirtyDaysAgo)
        )
      )
      .orderBy(desc(studyActivity.timestamp))

    // Get exam objectives
    const examObjectives = await db
      .select()
      .from(objectives)
      .where(eq(objectives.examId, examId))

    // Analyze performance by objective/topic
    const objectivePerformance = new Map()
    const generalPerformance = {
      totalQuestions: 0,
      correctAnswers: 0,
      timeSpent: 0
    }

    activities.forEach(activity => {
      const activityData = activity.activityData ? JSON.parse(activity.activityData) : {}
      const objectiveId = activityData.objectiveId
      
      // Update general performance
      generalPerformance.totalQuestions += activity.questionsAnswered || 0
      generalPerformance.correctAnswers += activity.correctAnswers || 0
      generalPerformance.timeSpent += activity.timeSpent || 0

      // Update objective-specific performance
      if (objectiveId) {
        if (!objectivePerformance.has(objectiveId)) {
          objectivePerformance.set(objectiveId, {
            objectiveId,
            totalQuestions: 0,
            correctAnswers: 0,
            timeSpent: 0,
            accuracy: 0,
            averageTime: 0,
            sessionCount: 0
          })
        }
        
        const objPerf = objectivePerformance.get(objectiveId)
        objPerf.totalQuestions += activity.questionsAnswered || 0
        objPerf.correctAnswers += activity.correctAnswers || 0
        objPerf.timeSpent += activity.timeSpent || 0
        objPerf.sessionCount++
      }
    })

    // Calculate metrics and identify weak areas
    const weakAreas = []
    const strongAreas = []
    const overallAccuracy = generalPerformance.totalQuestions > 0 ? 
      (generalPerformance.correctAnswers / generalPerformance.totalQuestions) * 100 : 0

    // Analyze each objective
    for (const [objectiveId, performance] of objectivePerformance) {
      const objective = examObjectives.find(obj => obj.id === objectiveId)
      if (!objective) continue

      // Calculate metrics
      const accuracy = performance.totalQuestions > 0 ? 
        (performance.correctAnswers / performance.totalQuestions) * 100 : 0
      const averageTime = performance.totalQuestions > 0 ? 
        performance.timeSpent / performance.totalQuestions : 0

      performance.accuracy = accuracy
      performance.averageTime = averageTime

      // Determine if this is a weak area
      const isWeakArea = accuracy < overallAccuracy * 0.85 || accuracy < 70
      const isStrongArea = accuracy > overallAccuracy * 1.15 && accuracy >= 85

      const areaData = {
        objective: {
          id: objective.id,
          title: objective.title,
          description: objective.description,
          weight: objective.weight
        },
        performance: {
          accuracy: Math.round(accuracy * 10) / 10,
          totalQuestions: performance.totalQuestions,
          correctAnswers: performance.correctAnswers,
          averageTime: Math.round(averageTime),
          sessionCount: performance.sessionCount,
          timeSpent: performance.timeSpent
        },
        recommendation: generateRecommendation(accuracy, averageTime, performance.totalQuestions)
      }

      if (isWeakArea) {
        weakAreas.push(areaData)
      } else if (isStrongArea) {
        strongAreas.push(areaData)
      }
    }

    // Sort weak areas by severity (lowest accuracy first)
    weakAreas.sort((a, b) => a.performance.accuracy - b.performance.accuracy)
    
    // Sort strong areas by performance (highest accuracy first)
    strongAreas.sort((a, b) => b.performance.accuracy - a.performance.accuracy)

    // Generate focus plan
    const focusPlan = generateFocusPlan(weakAreas, overallAccuracy)

    return {
      success: true,
      data: {
        examId,
        overallPerformance: {
          accuracy: Math.round(overallAccuracy * 10) / 10,
          totalQuestions: generalPerformance.totalQuestions,
          correctAnswers: generalPerformance.correctAnswers,
          timeSpent: generalPerformance.timeSpent,
          averageTime: generalPerformance.totalQuestions > 0 ? 
            Math.round(generalPerformance.timeSpent / generalPerformance.totalQuestions) : 0
        },
        weakAreas,
        strongAreas,
        focusPlan,
        analysisDate: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Weak areas analysis error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to analyze weak areas'
    })
  }
})

function generateRecommendation(accuracy: number, averageTime: number, totalQuestions: number) {
  if (totalQuestions < 10) {
    return {
      type: 'practice',
      message: 'Practice more questions in this area to get better insights.',
      action: 'Answer 10+ questions to establish baseline performance'
    }
  }
  
  if (accuracy < 50) {
    return {
      type: 'foundation',
      message: 'This area needs fundamental review. Start with basic concepts.',
      action: 'Review core concepts and attempt easier questions'
    }
  }
  
  if (accuracy < 70) {
    return {
      type: 'improvement',
      message: 'Focus on understanding why you get questions wrong.',
      action: 'Review incorrect answers and practice similar questions'
    }
  }
  
  if (averageTime > 120) { // More than 2 minutes per question
    return {
      type: 'speed',
      message: 'You understand the concepts but need to work on speed.',
      action: 'Practice timed sessions to improve response time'
    }
  }
  
  return {
    type: 'maintain',
    message: 'Good performance! Keep practicing to maintain this level.',
    action: 'Continue regular practice with mixed question types'
  }
}

function generateFocusPlan(weakAreas: any[], overallAccuracy: number) {
  if (weakAreas.length === 0) {
    return {
      priority: 'maintenance',
      message: 'Great work! No significant weak areas detected.',
      recommendations: [
        'Continue balanced study across all objectives',
        'Focus on maintaining your strong performance',
        'Take practice tests to simulate exam conditions'
      ]
    }
  }

  const criticalAreas = weakAreas.filter(area => area.performance.accuracy < 50)
  const improvementAreas = weakAreas.filter(area => 
    area.performance.accuracy >= 50 && area.performance.accuracy < 70
  )

  if (criticalAreas.length > 0) {
    return {
      priority: 'critical',
      message: `You have ${criticalAreas.length} critical area(s) that need immediate attention.`,
      recommendations: [
        `Start with "${criticalAreas[0].objective.title}" - your weakest area`,
        'Review fundamental concepts before attempting questions',
        'Spend 60% of study time on these critical areas',
        'Track improvement daily until accuracy reaches 70%+'
      ]
    }
  }

  if (improvementAreas.length > 0) {
    return {
      priority: 'improvement',
      message: `Focus on ${improvementAreas.length} area(s) that need improvement.`,
      recommendations: [
        `Prioritize "${improvementAreas[0].objective.title}"`,
        'Spend 40% of study time on these areas',
        'Review explanations for incorrect answers carefully',
        'Practice until accuracy consistently exceeds 75%'
      ]
    }
  }

  return {
    priority: 'maintenance',
    message: 'Your weak areas are minor. Focus on consistent improvement.',
    recommendations: [
      'Alternate between weak and strong areas',
      'Take regular practice tests',
      'Fine-tune understanding in weaker topics'
    ]
  }
}