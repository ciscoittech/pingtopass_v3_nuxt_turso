import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // TODO: Add admin role check
    // if (!session.user.role?.includes('admin')) {
    //   throw createError({
    //     statusCode: 403,
    //     statusMessage: 'Admin access required'
    //   })
    // }

    const objectiveId = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { title, description, weight } = body

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
      .then(rows => rows[0])

    if (!existingObjective) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Objective not found'
      })
    }

    // Validate fields if provided
    if (title && title.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Title cannot be empty'
      })
    }

    if (weight !== undefined && (weight < 0 || weight > 100)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Weight must be between 0 and 100'
      })
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (weight !== undefined) updateData.weight = weight

    const updatedObjective = await db
      .update(objectives)
      .set(updateData)
      .where(eq(objectives.id, objectiveId))
      .returning()

    return {
      success: true,
      data: updatedObjective[0]
    }

  } catch (error: any) {
    console.error('Update objective error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to update objective'
    })
  }
})