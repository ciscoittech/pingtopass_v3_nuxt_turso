import { z } from 'zod'
import { useDB } from '~/server/utils/db'
import { flags, users } from '~/server/database/schema'
import { eq, and } from 'drizzle-orm'
import { generateId } from '~/server/utils/id'

const flagSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  isFlagged: z.boolean(),
  flagType: z.enum(['review', 'difficult', 'incorrect', 'confusing']).optional(),
  reason: z.string().max(500).optional()
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
    const validatedData = flagSchema.parse(body)

    const userId = session.user.id
    const { questionId, isFlagged, flagType, reason } = validatedData

    if (isFlagged) {
      // Add or update flag
      const existingFlag = await db
        .select()
        .from(flags)
        .where(and(
          eq(flags.userId, userId),
          eq(flags.questionId, questionId)
        ))
        .get()

      if (existingFlag) {
        // Update existing flag
        await db
          .update(flags)
          .set({
            flagType: flagType || existingFlag.flagType,
            reason: reason || existingFlag.reason,
            isResolved: false,
            resolvedAt: null,
            createdAt: Math.floor(Date.now() / 1000) // Update timestamp for re-flagging
          })
          .where(eq(flags.id, existingFlag.id))
      } else {
        // Create new flag
        await db
          .insert(flags)
          .values({
            id: generateId('flg'),
            userId,
            questionId,
            flagType: flagType || 'review',
            reason,
            createdAt: Math.floor(Date.now() / 1000),
            isResolved: false
          })
      }
    } else {
      // Remove flag (mark as resolved)
      await db
        .update(flags)
        .set({
          isResolved: true,
          resolvedAt: Math.floor(Date.now() / 1000)
        })
        .where(and(
          eq(flags.userId, userId),
          eq(flags.questionId, questionId)
        ))
    }

    return {
      success: true,
      data: {
        questionId,
        isFlagged,
        flagType: flagType || 'review',
        message: isFlagged ? 'Question flagged for review' : 'Flag removed'
      }
    }

  } catch (error) {
    console.error('Flag error:', error)
    
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