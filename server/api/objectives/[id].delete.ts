import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema/objectives'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    const objectiveId = getRouterParam(event, 'id')
    
    if (!objectiveId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Objective ID is required'
      })
    }

    // Check if objective exists
    const existingObjective = await db
      .select()
      .from(objectives)
      .where(eq(objectives.id, objectiveId))
      .get()

    if (!existingObjective) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Objective not found'
      })
    }

    // Delete the objective
    await db
      .delete(objectives)
      .where(eq(objectives.id, objectiveId))

    console.log(`[API] /api/objectives/${objectiveId} - Deleted objective`)

    return {
      success: true,
      message: 'Objective deleted successfully'
    }
  } catch (error: any) {
    console.error('Failed to delete objective:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete objective'
    })
  }
})