import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema/objectives'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    const query = getQuery(event)
    const examId = query.examId as string

    let queryBuilder = db
      .select({
        id: objectives.id,
        examId: objectives.examId,
        title: objectives.title,
        description: objectives.description,
        weight: objectives.weight,
        order: objectives.order,
        isActive: objectives.isActive,
        createdAt: objectives.createdAt,
        updatedAt: objectives.updatedAt
      })
      .from(objectives)

    // If examId is provided, filter by it
    if (examId) {
      queryBuilder = queryBuilder.where(eq(objectives.examId, examId))
    }

    // Always order by the order field
    queryBuilder = queryBuilder.orderBy(asc(objectives.order))

    const examObjectives = await queryBuilder.all()

    console.log(`[API] /api/objectives - Found ${examObjectives.length} objectives${examId ? ` for exam ${examId}` : ''}`)
    
    // Transform the data to match frontend expectations
    const transformedObjectives = examObjectives.map(obj => ({
      ...obj,
      isActive: obj.isActive === 1 // Convert to boolean
    }))
    
    return {
      success: true,
      data: transformedObjectives
    }
  } catch (error: any) {
    console.error('Failed to fetch objectives:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch objectives'
    })
  }
})