import { nanoid } from 'nanoid'
import { twitterCompetitors } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin access
    const user = await requireUserSession(event)
    if (!user.user?.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const body = await readBody(event)
    const { username, name, description, category, priority, notes } = body

    // Validate required fields
    if (!username || !name || !category) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username, name, and category are required'
      })
    }

    // Validate category
    if (!['direct', 'indirect', 'influencer'].includes(category)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Category must be direct, indirect, or influencer'
      })
    }

    // Validate priority
    if (priority && !['high', 'medium', 'low'].includes(priority)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Priority must be high, medium, or low'
      })
    }

    const db = useDatabase()

    // Check if competitor already exists
    const existing = await db
      .select()
      .from(twitterCompetitors)
      .where(eq(twitterCompetitors.username, username.toLowerCase()))

    if (existing.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Competitor with this username already exists'
      })
    }

    // Create new competitor
    const competitorId = `comp_${nanoid()}`
    
    await db.insert(twitterCompetitors).values({
      id: competitorId,
      username: username.toLowerCase(),
      name,
      description: description || null,
      category,
      priority: priority || 'medium',
      notes: notes || null,
      isActive: true,
      addedAt: Math.floor(Date.now() / 1000)
    })

    return {
      success: true,
      data: {
        id: competitorId,
        username: username.toLowerCase(),
        name,
        category,
        priority: priority || 'medium'
      },
      message: 'Competitor added successfully'
    }

  } catch (error: any) {
    console.error('Failed to add competitor:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to add competitor'
    })
  }
})