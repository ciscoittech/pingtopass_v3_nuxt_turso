import { db } from '~/server/database/db'
import { userProgress, users, userStreaks } from '~/server/database/schema'
import { eq, desc, and, gte, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = (query.category as string) || 'points'
    const timeframe = (query.timeframe as string) || 'all_time'
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)

    // Calculate date filter for timeframe
    let dateFilter = undefined
    if (timeframe !== 'all_time') {
      const now = Math.floor(Date.now() / 1000)
      let daysBack = 30 // month default
      
      switch (timeframe) {
        case 'week':
          daysBack = 7
          break
        case 'quarter':
          daysBack = 90
          break
        case 'year':
          daysBack = 365
          break
      }
      
      dateFilter = now - (daysBack * 24 * 60 * 60)
    }

    let leaderboardData = []

    switch (category) {
      case 'points':
        leaderboardData = await getPointsLeaderboard(limit, dateFilter)
        break
      case 'accuracy':
        leaderboardData = await getAccuracyLeaderboard(limit, dateFilter)
        break
      case 'streak':
        leaderboardData = await getStreakLeaderboard(limit)
        break
      case 'questions':
        leaderboardData = await getQuestionsLeaderboard(limit, dateFilter)
        break
      case 'study_time':
        leaderboardData = await getStudyTimeLeaderboard(limit, dateFilter)
        break
      default:
        leaderboardData = await getPointsLeaderboard(limit, dateFilter)
    }

    // Add rank numbers
    const rankedData = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isCurrentUser: false // Will be set by frontend
    }))

    return {
      success: true,
      data: {
        category,
        timeframe,
        entries: rankedData,
        metadata: {
          totalEntries: rankedData.length,
          lastUpdated: new Date().toISOString(),
          description: getLeaderboardDescription(category, timeframe)
        }
      }
    }

  } catch (error) {
    console.error('Leaderboard error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch leaderboard'
    })
  }
})

async function getPointsLeaderboard(limit: number, dateFilter?: number) {
  const baseQuery = db
    .select({
      userId: userProgress.userId,
      userName: users.name,
      userAvatar: users.avatar,
      score: userProgress.totalPoints,
      metadata: sql<string>`json_object(
        'level', ${userProgress.level},
        'totalQuestions', ${userProgress.totalQuestions},
        'studyTime', ${userProgress.totalStudyTime},
        'currentAccuracy', ${userProgress.currentAccuracy}
      )`
    })
    .from(userProgress)
    .innerJoin(users, eq(userProgress.userId, users.id))
    .where(
      and(
        gte(userProgress.totalPoints, 0),
        dateFilter ? gte(userProgress.updatedAt, dateFilter) : undefined
      )
    )
    .orderBy(desc(userProgress.totalPoints))
    .limit(limit)

  return await baseQuery
}

async function getAccuracyLeaderboard(limit: number, dateFilter?: number) {
  return await db
    .select({
      userId: userProgress.userId,
      userName: users.name,
      userAvatar: users.avatar,
      score: userProgress.currentAccuracy,
      metadata: sql<string>`json_object(
        'totalQuestions', ${userProgress.totalQuestions},
        'correctAnswers', ${userProgress.correctAnswers},
        'totalPoints', ${userProgress.totalPoints},
        'level', ${userProgress.level}
      )`
    })
    .from(userProgress)
    .innerJoin(users, eq(userProgress.userId, users.id))
    .where(
      and(
        gte(userProgress.totalQuestions, 50), // Minimum questions for accuracy ranking
        dateFilter ? gte(userProgress.updatedAt, dateFilter) : undefined
      )
    )
    .orderBy(desc(userProgress.currentAccuracy))
    .limit(limit)
}

async function getStreakLeaderboard(limit: number) {
  return await db
    .select({
      userId: userStreaks.userId,
      userName: users.name,
      userAvatar: users.avatar,
      score: userStreaks.currentDailyStreak,
      metadata: sql<string>`json_object(
        'longestDailyStreak', ${userStreaks.longestDailyStreak},
        'currentAnswerStreak', ${userStreaks.currentAnswerStreak},
        'longestAnswerStreak', ${userStreaks.longestAnswerStreak}
      )`
    })
    .from(userStreaks)
    .innerJoin(users, eq(userStreaks.userId, users.id))
    .where(gte(userStreaks.currentDailyStreak, 1))
    .orderBy(desc(userStreaks.currentDailyStreak))
    .limit(limit)
}

async function getQuestionsLeaderboard(limit: number, dateFilter?: number) {
  return await db
    .select({
      userId: userProgress.userId,
      userName: users.name,
      userAvatar: users.avatar,
      score: userProgress.totalQuestions,
      metadata: sql<string>`json_object(
        'currentAccuracy', ${userProgress.currentAccuracy},
        'correctAnswers', ${userProgress.correctAnswers},
        'totalStudyTime', ${userProgress.totalStudyTime},
        'totalPoints', ${userProgress.totalPoints}
      )`
    })
    .from(userProgress)
    .innerJoin(users, eq(userProgress.userId, users.id))
    .where(
      and(
        gte(userProgress.totalQuestions, 1),
        dateFilter ? gte(userProgress.updatedAt, dateFilter) : undefined
      )
    )
    .orderBy(desc(userProgress.totalQuestions))
    .limit(limit)
}

async function getStudyTimeLeaderboard(limit: number, dateFilter?: number) {
  return await db
    .select({
      userId: userProgress.userId,
      userName: users.name,
      userAvatar: users.avatar,
      score: userProgress.totalStudyTime,
      metadata: sql<string>`json_object(
        'totalQuestions', ${userProgress.totalQuestions},
        'currentAccuracy', ${userProgress.currentAccuracy},
        'totalStudySessions', ${userProgress.totalStudySessions},
        'totalPoints', ${userProgress.totalPoints}
      )`
    })
    .from(userProgress)
    .innerJoin(users, eq(userProgress.userId, users.id))
    .where(
      and(
        gte(userProgress.totalStudyTime, 300), // Minimum 5 minutes
        dateFilter ? gte(userProgress.updatedAt, dateFilter) : undefined
      )
    )
    .orderBy(desc(userProgress.totalStudyTime))
    .limit(limit)
}

function getLeaderboardDescription(category: string, timeframe: string): string {
  const timeframeText = timeframe === 'all_time' ? 'All Time' : 
    timeframe === 'week' ? 'This Week' :
    timeframe === 'month' ? 'This Month' :
    timeframe === 'quarter' ? 'This Quarter' :
    timeframe === 'year' ? 'This Year' : 'All Time'

  switch (category) {
    case 'points':
      return `Top learners by total points earned - ${timeframeText}`
    case 'accuracy':
      return `Most accurate students (min. 50 questions) - ${timeframeText}`
    case 'streak':
      return `Longest current daily study streaks - ${timeframeText}`
    case 'questions':
      return `Most questions answered - ${timeframeText}`
    case 'study_time':
      return `Most time spent studying - ${timeframeText}`
    default:
      return `Leaderboard - ${timeframeText}`
  }
}