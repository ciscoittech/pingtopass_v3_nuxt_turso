import { useDB } from '~/server/utils/db'
import { eq, and } from 'drizzle-orm'
import { flags, questions } from '~/server/database/schema'
import { generateId } from '~/server/utils/id'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  try {
    const questionId = getRouterParam(event, 'id')
    
    if (!questionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Question ID is required'
      })
    }
    
    // Check if question exists
    const db = useDB()
    const [question] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)
    
    if (!question) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Question not found'
      })
    }
    
    // Check if flag exists
    const [existingFlag] = await db
      .select({ id: flags.id })
      .from(flags)
      .where(
        and(
          eq(flags.userId, session.user.id),
          eq(flags.questionId, questionId)
        )
      )
      .limit(1)
    
    if (existingFlag) {
      // Remove flag
      await db.delete(flags)
        .where(
          and(
            eq(flags.userId, session.user.id),
            eq(flags.questionId, questionId)
          )
        )
      
      return {
        success: true,
        data: {
          flagged: false,
          message: 'Flag removed'
        }
      }
    } else {
      // Add flag
      await db.insert(flags)
        .values({
          id: generateId('flag'),
          userId: session.user.id,
          questionId,
          flagType: 'review', // Default flag type
          reason: 'Flagged for review', // Default reason, can be expanded later
          createdAt: Date.now(),
          isResolved: false
        })
      
      return {
        success: true,
        data: {
          flagged: true,
          message: 'Question flagged for review'
        }
      }
    }
  } catch (error: any) {
    console.error('Error toggling flag:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle flag'
    })
  }
})