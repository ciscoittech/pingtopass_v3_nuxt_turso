import { examService } from '~/server/utils/examService'
import type { ExamListResponse } from '~/server/utils/types/examTypes'
import { z } from 'zod'

// Query parameter validation
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['name', 'code', 'createdAt', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
})

export default defineEventHandler(async (event): Promise<ExamListResponse> => {
  const vendorId = getRouterParam(event, 'vendorId')
  const user = event.context.user
  
  if (!vendorId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vendor ID is required'
    })
  }

  try {
    // Parse and validate query parameters
    const query = getQuery(event)
    const filters = querySchema.parse(query)
    
    // Get exams for specific vendor
    const result = await examService.getList(user?.id || null, {
      ...filters,
      vendorId,
      isActive: true // Only show active exams
    })
    
    if (result.total === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: `No exams found for vendor '${vendorId}'`
      })
    }
    
    console.log(`[API] /api/vendors/${vendorId}/exams - Found ${result.total} exams`)
    
    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    console.error('Failed to fetch vendor exams:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid query parameters',
        data: error.errors
      })
    }
    
    // Re-throw if it's already a proper error
    if (error.statusCode) throw error
    
    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch vendor exams'
    })
  }
})