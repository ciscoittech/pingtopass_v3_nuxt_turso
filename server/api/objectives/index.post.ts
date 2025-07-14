import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema'
import { generateId } from '~/server/utils/id'

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

    const body = await readBody(event)
    const { examId, title, description, weight } = body

    // Validate required fields
    if (!examId || !title) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Exam ID and title are required'
      })
    }

    // Validate weight (should be between 0 and 100)
    if (weight !== undefined && (weight < 0 || weight > 100)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Weight must be between 0 and 100'
      })
    }

    const objectiveId = generateId('obj')
    const now = new Date().toISOString()

    const db = useDB()

    const newObjective = await db.insert(objectives).values({
      id: objectiveId,
      examId,
      title: title.trim(),
      description: description?.trim() || null,
      weight: weight || null,
      createdAt: now,
      updatedAt: now
    }).returning()

    return {
      success: true,
      data: newObjective[0]
    }

  } catch (error: any) {
    console.error('Create objective error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to create objective'
    })
  }
})
