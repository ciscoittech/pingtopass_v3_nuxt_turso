import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    const query = getQuery(event)
    const examId = query.examId as string

    if (!examId) {
      return {
        success: true,
        data: []
      }
    }

    // Fetch objectives for the specified exam
    const examObjectives = await db
      .select({
        id: objectives.id,
        examId: objectives.examId,
        title: objectives.title,
        description: objectives.description,
        weight: objectives.weight
      })
      .from(objectives)
      .where(eq(objectives.examId, examId))
      .all()

    console.log(`[API] /api/objectives - Found ${examObjectives.length} objectives for exam ${examId}`)
    
    return {
      success: true,
      data: examObjectives
    }
  } catch (error: any) {
    console.error('Failed to fetch objectives:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch objectives'
    })
  }
})