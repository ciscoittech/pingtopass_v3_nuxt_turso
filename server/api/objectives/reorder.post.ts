import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema/objectives'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    const body = await readBody(event)
    
    if (!body.updates || !Array.isArray(body.updates)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Updates array is required'
      })
    }

    // Validate all updates have required fields
    for (const update of body.updates) {
      if (!update.id || update.order === undefined || update.order === null) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Each update must have id and order'
        })
      }
    }

    // Update each objective's order
    const updatePromises = body.updates.map(update => 
      db
        .update(objectives)
        .set({ 
          order: Number(update.order),
          updatedAt: new Date().toISOString()
        })
        .where(eq(objectives.id, update.id))
    )

    await Promise.all(updatePromises)

    console.log(`[API] /api/objectives/reorder - Reordered ${body.updates.length} objectives`)

    return {
      success: true,
      message: `Successfully reordered ${body.updates.length} objectives`
    }
  } catch (error: any) {
    console.error('Failed to reorder objectives:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to reorder objectives'
    })
  }
})