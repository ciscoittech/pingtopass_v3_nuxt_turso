import { z } from 'zod'
import { db } from '~/server/database/db'
import { bookmarks, users } from '~/server/database/schema'
import { eq, and } from 'drizzle-orm'
import { generateId } from '~/server/utils/id'

const bookmarkSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  isBookmarked: z.boolean()
})

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

    // Validate request body
    const body = await readBody(event)
    const validatedData = bookmarkSchema.parse(body)

    const userId = session.user.id
    const { questionId, isBookmarked } = validatedData

    if (isBookmarked) {
      // Add bookmark
      const existingBookmark = await db
        .select()
        .from(bookmarks)
        .where(and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.questionId, questionId)
        ))
        .get()

      if (!existingBookmark) {
        await db
          .insert(bookmarks)
          .values({
            id: generateId('bkm'),
            userId,
            questionId,
            createdAt: Math.floor(Date.now() / 1000)
          })
      }
    } else {
      // Remove bookmark
      await db
        .delete(bookmarks)
        .where(and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.questionId, questionId)
        ))
    }

    return {
      success: true,
      data: {
        questionId,
        isBookmarked,
        message: isBookmarked ? 'Question bookmarked' : 'Bookmark removed'
      }
    }

  } catch (error) {
    console.error('Bookmark error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})