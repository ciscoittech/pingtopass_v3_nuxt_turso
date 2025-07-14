import { useDB } from '~/server/utils/db'
import { userProgress, studyActivity } from '~/server/database/schema'
import { eq, desc, and, gte } from 'drizzle-orm'
import { checkAchievements, type Achievement } from '~/server/utils/achievementSystem'

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

    // Get user's current progress
    const progress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .then(rows => rows[0])

    if (!progress) {
      return {
        success: true,
        data: {
          newAchievements: [],
          totalPoints: 0
        }
      }
    }

    // Get recent activity for special achievements
    const today = new Date()
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const weekStartTimestamp = Math.floor(weekStart.getTime() / 1000)

    const recentActivity = await db
      .select()
      .from(studyActivity)
      .where(
        and(
          eq(studyActivity.userId, userId),
          gte(studyActivity.timestamp, weekStartTimestamp)
        )
      )
      .orderBy(desc(studyActivity.timestamp))

    // Analyze activity patterns for special achievements
    const activityAnalysis = analyzeActivityPatterns(recentActivity)

    // Prepare stats for achievement checking
    const userStats = {
      // Basic stats
      currentAccuracy: progress.currentAccuracy || 0,
      totalQuestions: progress.totalQuestions || 0,
      totalStudyTime: progress.totalStudyTime || 0,
      testsCompleted: progress.testsCompleted || 0,
      bestTestScore: progress.bestTestScore || 0,
      masteryLevel: progress.masteryLevel || 'beginner',
      
      // Streak stats
      streaks: {
        currentDaily: progress.currentDailyStreak || 0,
        currentAnswer: progress.currentAnswerStreak || 0,
        longestDaily: progress.longestDailyStreak || 0
      },
      
      // Special activity patterns
      ...activityAnalysis
    }

    // Get previously earned achievements
    const previousAchievements = progress.achievements ? 
      JSON.parse(progress.achievements) : []

    // Check for new achievements
    const newAchievements = checkAchievements(userStats, previousAchievements)

    // Update user progress with new achievements
    if (newAchievements.length > 0) {
      const updatedAchievements = [
        ...previousAchievements,
        ...newAchievements.map(a => a.id)
      ]

      await db
        .update(userProgress)
        .set({
          achievements: JSON.stringify(updatedAchievements),
          totalPoints: (progress.totalPoints || 0) + newAchievements.reduce((sum, a) => sum + a.points, 0),
          updatedAt: Math.floor(Date.now() / 1000)
        })
        .where(eq(userProgress.userId, userId))
    }

    return {
      success: true,
      data: {
        newAchievements,
        totalPoints: (progress.totalPoints || 0) + newAchievements.reduce((sum, a) => sum + a.points, 0)
      }
    }

  } catch (error) {
    console.error('Achievement check error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check achievements'
    })
  }
})

function analyzeActivityPatterns(activities: any[]) {
  const patterns = {
    hasEarlyMorningStudy: false,
    hasLateNightStudy: false,
    hasWeekendStudy: false
  }

  const weekendDays = new Set()

  activities.forEach(activity => {
    const activityDate = new Date(activity.timestamp * 1000)
    const hour = activityDate.getHours()
    const dayOfWeek = activityDate.getDay()

    // Check for early morning study (before 8 AM)
    if (hour < 8) {
      patterns.hasEarlyMorningStudy = true
    }

    // Check for late night study (after 10 PM)
    if (hour >= 22) {
      patterns.hasLateNightStudy = true
    }

    // Check for weekend study
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      weekendDays.add(dayOfWeek)
    }
  })

  // Weekend warrior requires both Saturday and Sunday
  patterns.hasWeekendStudy = weekendDays.size >= 2

  return patterns
}