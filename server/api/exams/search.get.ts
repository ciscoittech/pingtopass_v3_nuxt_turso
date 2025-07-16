import { examService } from '~/server/utils/examService'
import { z } from 'zod'

// Query parameter validation
const querySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10)
})

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate query parameters
    const query = getQuery(event)
    const { q, limit } = querySchema.parse(query)
    
    // Search exams
    const results = await examService.search(q, limit)
    
    console.log(`[API] /api/exams/search - Query: "${q}", Found: ${results.length} results`)
    
    return {
      success: true,
      data: {
        query: q,
        results,
        count: results.length
      }
    }
  } catch (error: any) {
    console.error('Failed to search exams:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid search parameters',
        data: error.errors
      })
    }
    
    // Re-throw if it's already a proper error
    if (error.statusCode) throw error
    
    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to search exams'
    })
  }
})