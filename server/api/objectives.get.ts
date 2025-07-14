import { db } from '~/server/database/db'
import { objectives } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const examId = query.examId as string

    if (!examId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Exam ID is required'
      })
    }

    const examObjectives = await db
      .select()
      .from(objectives)
      .where(eq(objectives.examId, examId))
      .orderBy(objectives.title)

    return {
      success: true,
      data: examObjectives
    }

  } catch (error) {
    console.error('Get objectives error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch objectives'
    })
  }
})