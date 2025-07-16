import { useDB } from '~/server/utils/db'
import { eq, and } from 'drizzle-orm'
import { bookmarks, questions } from '~/server/database/schema'
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
    
    // Check if bookmark exists
    const [existingBookmark] = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.user.id),
          eq(bookmarks.questionId, questionId)
        )
      )
      .limit(1)
    
    if (existingBookmark) {
      // Remove bookmark
      await db.delete(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, session.user.id),
            eq(bookmarks.questionId, questionId)
          )
        )
      
      return {
        success: true,
        data: {
          bookmarked: false,
          message: 'Bookmark removed'
        }
      }
    } else {
      // Add bookmark
      await db.insert(bookmarks)
        .values({
          id: generateId('bookmark'),
          userId: session.user.id,
          questionId,
          createdAt: Date.now()
        })
      
      return {
        success: true,
        data: {
          bookmarked: true,
          message: 'Question bookmarked'
        }
      }
    }
  } catch (error: any) {
    console.error('Error toggling bookmark:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle bookmark'
    })
  }
})