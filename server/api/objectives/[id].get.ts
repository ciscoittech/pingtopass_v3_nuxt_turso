import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const objectiveId = getRouterParam(event, 'id')
    
    if (!objectiveId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Objective ID is required'
      })
    }

    const objective = await db
      .select()
      .from(objectives)
      .where(eq(objectives.id, objectiveId))
      .then(rows => rows[0])

    if (!objective) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Objective not found'
      })
    }

    return {
      success: true,
      data: objective
    }

  } catch (error: any) {
    console.error('Get objective error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to fetch objective'
    })
  }
})