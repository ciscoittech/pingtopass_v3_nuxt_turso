import { useDB } from '~/server/utils/db'
import { users, userLevels, userStreaks, testSessions } from '~/server/database/schema'
import { desc, sql, eq, and, gte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    
    // Get authenticated user
    const session = await getUserSession(event)
    if (!session.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    const user = session.user
    
    // Get query parameters
    const query = getQuery(event)
    const limit = Number(query.limit) || 10
    const timeframe = query.timeframe as 'all' | 'month' | 'week' || 'all'
    
    // Calculate date filter
    let dateFilter = null
    const now = new Date()
    
    switch (timeframe) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = gte(testSessions.completedAt, weekAgo.toISOString())
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = gte(testSessions.completedAt, monthAgo.toISOString())
        break
    }
    
    // Get leaderboard data with XP and stats
    const leaderboardQuery = db
      .select({
        userId: users.id,
        name: users.name,
        picture: users.picture,
        totalXp: userLevels.experience,
        level: userLevels.level,
        rank: sql<number>`RANK() OVER (ORDER BY ${userLevels.experience} DESC)`,
        testsCompleted: sql<number>`
          COUNT(DISTINCT ${testSessions.id}) FILTER (WHERE ${testSessions.status} = 'completed')
        `,
        avgScore: sql<number>`
          ROUND(AVG(${testSessions.score}) FILTER (WHERE ${testSessions.status} = 'completed'), 1)
        `,
        studyStreak: userStreaks.currentDailyStreak,
      })
      .from(users)
      .leftJoin(userLevels, eq(users.id, userLevels.userId))
      .leftJoin(userStreaks, eq(users.id, userStreaks.userId))
      .leftJoin(
        testSessions,
        and(
          eq(users.id, testSessions.userId),
          dateFilter ? dateFilter : sql`1=1`
        )
      )
      .groupBy(users.id, userLevels.experience, userLevels.level, userStreaks.currentDailyStreak)
      .orderBy(desc(userLevels.experience))
      .limit(limit)
    
    const leaderboard = await leaderboardQuery
    
    // Get current user's rank and stats
    const userRankQuery = db
      .select({
        userId: users.id,
        totalXp: userLevels.experience,
        level: userLevels.level,
        rank: sql<number>`
          (SELECT COUNT(*) + 1 FROM ${userLevels} ul2 
           WHERE ul2.experience > ${userLevels.experience})
        `,
        testsCompleted: sql<number>`
          COUNT(DISTINCT ${testSessions.id}) FILTER (WHERE ${testSessions.status} = 'completed')
        `,
        avgScore: sql<number>`
          ROUND(AVG(${testSessions.score}) FILTER (WHERE ${testSessions.status} = 'completed'), 1)
        `,
        nextRankXp: sql<number>`
          (SELECT MIN(ul2.experience) FROM ${userLevels} ul2 
           WHERE ul2.experience > ${userLevels.experience})
        `,
      })
      .from(users)
      .leftJoin(userLevels, eq(users.id, userLevels.userId))
      .leftJoin(
        testSessions,
        and(
          eq(users.id, testSessions.userId),
          dateFilter ? dateFilter : sql`1=1`
        )
      )
      .where(eq(users.id, user.id))
      .groupBy(users.id, userLevels.experience, userLevels.level)
    
    const [currentUserStats] = await userRankQuery
    
    // Calculate progress to next rank
    let progressToNext = 0
    if (currentUserStats?.nextRankXp) {
      const xpGap = currentUserStats.nextRankXp - (currentUserStats.totalXp || 0)
      const xpNeeded = currentUserStats.nextRankXp - (leaderboard[currentUserStats.rank - 2]?.totalXp || 0)
      progressToNext = Math.round(((xpNeeded - xpGap) / xpNeeded) * 100)
    }
    
    return {
      success: true,
      data: {
        leaderboard: leaderboard.map((user, index) => ({
          ...user,
          rank: index + 1,
          isCurrentUser: user.userId === currentUserStats?.userId
        })),
        currentUser: {
          ...currentUserStats,
          progressToNext
        },
        timeframe
      }
    }
  } catch (error: any) {
    console.error('Leaderboard fetch error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch leaderboard data'
    })
  }
})