import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema/objectives'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    const objectiveId = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!objectiveId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Objective ID is required'
      })
    }

    // Validate weight if provided
    if (body.weight !== undefined && body.weight !== null) {
      if (body.weight < 1 || body.weight > 100) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Weight must be between 1 and 100'
        })
      }
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    // Only update fields that are provided
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.weight !== undefined) updateData.weight = Number(body.weight)
    if (body.order !== undefined) updateData.order = Number(body.order)
    if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0

    await db
      .update(objectives)
      .set(updateData)
      .where(eq(objectives.id, objectiveId))

    console.log(`[API] /api/objectives/${objectiveId} - Updated objective`)

    // Fetch and return the updated objective
    const updatedObjective = await db
      .select()
      .from(objectives)
      .where(eq(objectives.id, objectiveId))
      .get()

    if (!updatedObjective) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Objective not found'
      })
    }

    return {
      success: true,
      data: {
        ...updatedObjective,
        isActive: updatedObjective.isActive === 1
      }
    }
  } catch (error: any) {
    console.error('Failed to update objective:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update objective'
    })
  }
})