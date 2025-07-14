import { db } from '~/server/database/db'
import { studyActivity, userProgress, exams } from '~/server/database/schema'
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
    const body = await readBody(event)
    const { examId, targetAccuracy = 80, weeksToGoal = 4, focusAreas = [] } = body

    // Get user's current progress for the exam
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)
    
    const recentActivity = await db
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

    // Get exam details
    const exam = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId))
      .then(rows => rows[0])

    if (!exam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exam not found'
      })
    }

    // Calculate current performance metrics
    let totalQuestions = 0
    let correctAnswers = 0
    let totalStudyTime = 0
    let sessionCount = 0
    let averageSessionTime = 0
    const dailyActivity = new Map()

    recentActivity.forEach(activity => {
      totalQuestions += activity.questionsAnswered || 0
      correctAnswers += activity.correctAnswers || 0
      totalStudyTime += activity.timeSpent || 0
      sessionCount++

      // Track daily activity
      const dayKey = new Date(activity.timestamp * 1000).toDateString()
      if (!dailyActivity.has(dayKey)) {
        dailyActivity.set(dayKey, { sessions: 0, time: 0, questions: 0 })
      }
      const dayData = dailyActivity.get(dayKey)
      dayData.sessions++
      dayData.time += activity.timeSpent || 0
      dayData.questions += activity.questionsAnswered || 0
    })

    const currentAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
    averageSessionTime = sessionCount > 0 ? totalStudyTime / sessionCount : 0

    // Analyze study patterns
    const studyDays = dailyActivity.size
    const averageQuestionsPerDay = studyDays > 0 ? totalQuestions / studyDays : 0
    const averageTimePerDay = studyDays > 0 ? totalStudyTime / studyDays : 0

    // Generate AI-powered recommendations
    const recommendations = generateStudyRecommendations({
      currentAccuracy,
      targetAccuracy,
      weeksToGoal,
      averageSessionTime,
      averageQuestionsPerDay,
      studyDays,
      examName: exam.name,
      focusAreas
    })

    // Create weekly plan
    const weeklyPlan = generateWeeklyPlan({
      currentAccuracy,
      targetAccuracy,
      weeksToGoal,
      averageSessionTime,
      recommendations
    })

    return {
      success: true,
      data: {
        examId,
        examName: exam.name,
        currentPerformance: {
          accuracy: Math.round(currentAccuracy * 10) / 10,
          studyTime: totalStudyTime,
          sessions: sessionCount,
          averageSessionTime: Math.round(averageSessionTime),
          studyDays,
          questionsAnswered: totalQuestions
        },
        goals: {
          targetAccuracy,
          weeksToGoal,
          accuracyGap: Math.max(0, targetAccuracy - currentAccuracy)
        },
        recommendations,
        weeklyPlan,
        generatedAt: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Study plan generation error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate study plan'
    })
  }
})

function generateStudyRecommendations(params: {
  currentAccuracy: number
  targetAccuracy: number
  weeksToGoal: number
  averageSessionTime: number
  averageQuestionsPerDay: number
  studyDays: number
  examName: string
  focusAreas: string[]
}) {
  const { currentAccuracy, targetAccuracy, weeksToGoal, averageSessionTime, averageQuestionsPerDay, studyDays } = params
  
  const recommendations = []
  
  // Accuracy-based recommendations
  if (currentAccuracy < 50) {
    recommendations.push({
      type: 'foundation',
      priority: 'high',
      title: 'Build Foundation Knowledge',
      description: 'Focus on core concepts and fundamentals. Start with easier questions to build confidence.',
      action: 'Study basic concepts for 20-30 minutes daily',
      icon: 'mdi-book-open-variant'
    })
  } else if (currentAccuracy < 70) {
    recommendations.push({
      type: 'practice',
      priority: 'high',
      title: 'Increase Practice Volume',
      description: 'Your understanding is growing. Focus on more practice questions to improve accuracy.',
      action: 'Answer 50+ questions per day with detailed review',
      icon: 'mdi-target'
    })
  } else if (currentAccuracy < targetAccuracy) {
    recommendations.push({
      type: 'refinement',
      priority: 'medium',
      title: 'Refine Weak Areas',
      description: 'You\'re doing well! Focus on specific topics where you struggle most.',
      action: 'Review incorrect answers and focus on weak topics',
      icon: 'mdi-tune'
    })
  }

  // Session time recommendations
  if (averageSessionTime < 900) { // Less than 15 minutes
    recommendations.push({
      type: 'time',
      priority: 'medium',
      title: 'Extend Study Sessions',
      description: 'Longer sessions allow for deeper learning and better retention.',
      action: 'Aim for 30-45 minute study sessions',
      icon: 'mdi-clock-outline'
    })
  } else if (averageSessionTime > 3600) { // More than 1 hour
    recommendations.push({
      type: 'time',
      priority: 'low',
      title: 'Take Regular Breaks',
      description: 'Very long sessions can lead to fatigue. Consider breaking them up.',
      action: 'Take 10-15 minute breaks every 45-60 minutes',
      icon: 'mdi-pause-circle'
    })
  }

  // Consistency recommendations
  if (studyDays < 20) { // Less than 20 days of activity in 30 days
    recommendations.push({
      type: 'consistency',
      priority: 'high',
      title: 'Study More Consistently',
      description: 'Regular daily practice is key to long-term retention and improvement.',
      action: 'Try to study at least 5 days per week',
      icon: 'mdi-calendar-check'
    })
  }

  // Goal-based recommendations
  const accuracyGap = targetAccuracy - currentAccuracy
  if (accuracyGap > 20 && weeksToGoal < 4) {
    recommendations.push({
      type: 'intensity',
      priority: 'high',
      title: 'Increase Study Intensity',
      description: 'To reach your goal in time, you\'ll need to study more intensively.',
      action: 'Increase daily study time and question volume by 50%',
      icon: 'mdi-rocket-launch'
    })
  }

  return recommendations
}

function generateWeeklyPlan(params: {
  currentAccuracy: number
  targetAccuracy: number
  weeksToGoal: number
  averageSessionTime: number
  recommendations: any[]
}) {
  const { currentAccuracy, targetAccuracy, weeksToGoal, averageSessionTime } = params
  
  const accuracyGap = targetAccuracy - currentAccuracy
  const weeklyImprovement = accuracyGap / weeksToGoal
  
  const plan = []
  
  for (let week = 1; week <= weeksToGoal; week++) {
    const weekTarget = currentAccuracy + (weeklyImprovement * week)
    
    // Determine focus based on week and current progress
    let focus = 'Practice & Review'
    let dailyGoal = {
      questions: Math.max(30, Math.round(averageSessionTime / 60 * 2)), // Rough estimate
      studyTime: Math.max(1800, averageSessionTime * 1.2), // 30 min minimum, 20% increase
      accuracy: Math.round(weekTarget)
    }

    if (week === 1) {
      focus = 'Foundation & Assessment'
      dailyGoal.questions = Math.round(dailyGoal.questions * 0.8) // Start easier
    } else if (week === weeksToGoal) {
      focus = 'Final Review & Test Prep'
      dailyGoal.questions = Math.round(dailyGoal.questions * 1.2) // Intensify
    } else if (accuracyGap > 20) {
      focus = 'Intensive Practice'
      dailyGoal.questions = Math.round(dailyGoal.questions * 1.1)
    }

    plan.push({
      week,
      focus,
      targetAccuracy: Math.round(weekTarget),
      dailyGoals: {
        questions: dailyGoal.questions,
        studyTimeMinutes: Math.round(dailyGoal.studyTime / 60),
        targetAccuracy: dailyGoal.accuracy
      },
      keyActivities: generateWeeklyActivities(week, focus, weeksToGoal)
    })
  }
  
  return plan
}

function generateWeeklyActivities(week: number, focus: string, totalWeeks: number) {
  const baseActivities = [
    'Complete daily practice questions',
    'Review incorrect answers thoroughly',
    'Take notes on difficult concepts'
  ]

  if (week === 1) {
    return [
      'Take a diagnostic practice test',
      'Identify your strongest and weakest areas',
      ...baseActivities,
      'Set up your study schedule and environment'
    ]
  } else if (week === totalWeeks) {
    return [
      'Take multiple full practice tests',
      'Focus on test-taking strategies',
      'Review all flagged questions',
      'Get adequate rest before the exam'
    ]
  } else if (focus.includes('Intensive')) {
    return [
      'Focus on weak areas identified',
      'Increase practice question volume',
      ...baseActivities,
      'Track improvement trends daily'
    ]
  }

  return [
    ...baseActivities,
    'Take a weekly progress assessment',
    'Adjust study plan based on performance'
  ]
}