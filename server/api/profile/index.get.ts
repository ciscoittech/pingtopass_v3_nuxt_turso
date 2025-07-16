import { eq, sql } from 'drizzle-orm'
import { users, userProgress, testSessions } from '~/server/database/schema'
import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const db = useDB()
    
    // Get user data from database
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
    
    if (!userData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Get user statistics
    const [progressStats] = await db
      .select({
        totalQuestions: sql`COUNT(DISTINCT ${userProgress.questionId})`.as('totalQuestions'),
        correctAnswers: sql`COUNT(CASE WHEN ${userProgress.isCorrect} = 1 THEN 1 END)`.as('correctAnswers'),
      })
      .from(userProgress)
      .where(eq(userProgress.userId, session.user.id))

    // Get test statistics
    const [testStats] = await db
      .select({
        totalTests: sql`COUNT(*)`.as('totalTests'),
        completedTests: sql`COUNT(CASE WHEN ${testSessions.status} = 'completed' THEN 1 END)`.as('completedTests'),
      })
      .from(testSessions)
      .where(eq(testSessions.userId, session.user.id))

    // Calculate posts count (for now, we'll use a placeholder)
    const postsCount = 0 // This would come from a posts table when implemented
    
    // Calculate followers/following (for now, we'll use placeholders)
    const followersCount = 0 // This would come from a followers table when implemented
    const followingCount = 0 // This would come from a following table when implemented

    return {
      data: {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatarUrl: userData.avatarUrl || '/images/profile/user6.jpg',
          role: userData.superAdmin ? 'Admin' : 'User',
          joinDate: userData.created_at,
          lastActive: userData.last_active,
          proAccount: userData.proAccount,
        },
        stats: {
          posts: postsCount,
          followers: followersCount,
          following: followingCount,
          questionsAnswered: Number(progressStats?.totalQuestions || 0),
          correctAnswers: Number(progressStats?.correctAnswers || 0),
          testsCompleted: Number(testStats?.completedTests || 0),
          totalTests: Number(testStats?.totalTests || 0),
        },
        social: {
          // Social links would be stored in a separate table
          facebook: null,
          twitter: null,
          dribbble: null,
          youtube: null,
        }
      }
    }
  } catch (error) {
    console.error('Profile fetch error:', error)
    throw error
  }
})