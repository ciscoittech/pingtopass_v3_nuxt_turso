import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema/objectives'
import { nanoid } from 'nanoid'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    const body = await readBody(event)
    
    // Validate required fields
    if (!body.examId || !body.title || body.weight === undefined || body.weight === null) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: examId, title, and weight are required'
      })
    }

    // Validate weight
    if (body.weight < 1 || body.weight > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Weight must be between 1 and 100'
      })
    }

    // Get the current max order for this exam
    let maxOrder = 0
    if (body.order === undefined || body.order === null) {
      const maxOrderResult = await db
        .select({ maxOrder: objectives.order })
        .from(objectives)
        .where(eq(objectives.examId, body.examId))
        .orderBy(desc(objectives.order))
        .limit(1)
        .get()
      
      maxOrder = maxOrderResult?.maxOrder || 0
    }

    const newObjective = {
      id: nanoid(),
      examId: body.examId,
      title: body.title,
      description: body.description || null,
      weight: Number(body.weight),
      order: body.order || maxOrder + 1,
      isActive: body.isActive !== false ? 1 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await db.insert(objectives).values(newObjective)

    console.log(`[API] /api/objectives - Created new objective: ${newObjective.id}`)

    return {
      success: true,
      data: {
        ...newObjective,
        isActive: newObjective.isActive === 1
      }
    }
  } catch (error: any) {
    console.error('Failed to create objective:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create objective'
    })
  }
})

// Import eq for the where clause
import { eq } from 'drizzle-orm'