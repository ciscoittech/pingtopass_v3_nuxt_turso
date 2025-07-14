import { getUserProgressMetrics } from '~/server/utils/progressCalculations'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const userId = session.user.id

    // Get comprehensive progress metrics
    const progressMetrics = await getUserProgressMetrics(userId)

    return {
      success: true,
      data: progressMetrics
    }

  } catch (error: any) {
    console.error('Get progress error:', error)
    
    // Re-throw authentication errors
    if (error.statusCode === 401) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})