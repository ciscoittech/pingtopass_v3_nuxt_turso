import { z } from 'zod'
import { db } from '~/server/database/db'
import { userProgress } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { generateId } from '~/server/utils/id'

const goalsSchema = z.object({
  weeklyGoal: z.number().min(0).max(10080).optional(), // max 7 days * 24 hours * 60 minutes
  monthlyGoal: z.number().min(0).max(43200).optional(), // max 30 days * 24 hours * 60 minutes
  dailyGoal: z.number().min(0).max(1440).optional() // max 24 hours * 60 minutes
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
    const validatedData = goalsSchema.parse(body)

    const userId = session.user.id
    const timestamp = Math.floor(Date.now() / 1000)

    // Get or create user progress record
    let progressRecord = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .get()

    if (!progressRecord) {
      // Create new progress record
      const newProgress = {
        id: generateId('prog'),
        userId,
        examId: 'overall',
        weeklyGoal: validatedData.weeklyGoal || 0,
        monthlyGoal: validatedData.monthlyGoal || 0,
        firstStudyDate: timestamp,
        lastUpdated: timestamp,
        createdAt: timestamp
      }
      
      await db.insert(userProgress).values(newProgress)
      progressRecord = newProgress
    } else {
      // Update existing record
      const updates: any = {
        lastUpdated: timestamp
      }
      
      if (validatedData.weeklyGoal !== undefined) {
        updates.weeklyGoal = validatedData.weeklyGoal
      }
      
      if (validatedData.monthlyGoal !== undefined) {
        updates.monthlyGoal = validatedData.monthlyGoal
      }
      
      await db
        .update(userProgress)
        .set(updates)
        .where(eq(userProgress.userId, userId))
      
      // Update the record object
      Object.assign(progressRecord, updates)
    }

    return {
      success: true,
      data: {
        goals: {
          weekly: progressRecord.weeklyGoal || 0,
          monthly: progressRecord.monthlyGoal || 0
        },
        message: 'Goals updated successfully'
      }
    }

  } catch (error) {
    console.error('Update goals error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid goal data',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})