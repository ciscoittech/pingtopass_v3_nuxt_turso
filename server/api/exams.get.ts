import { examService } from '~/server/utils/examService'
import type { ExamListResponse, ExamFilters } from '~/server/utils/types/examTypes'
import { z } from 'zod'

// Query parameter validation schema
const querySchema = z.object({
  vendorId: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  hasQuestions: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['name', 'code', 'createdAt', 'updatedAt', 'popularity']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
})

export default defineEventHandler(async (event): Promise<ExamListResponse> => {
  const user = event.context.user
  
  try {
    // Parse and validate query parameters
    const query = getQuery(event)
    const filters = querySchema.parse(query)
    
    // Non-admin users only see active exams by default
    if (!user?.isAdmin && filters.isActive === undefined) {
      filters.isActive = true
    }
    
    // Get exam list with filters
    const result = await examService.getList(user?.id || null, filters as ExamFilters)
    
    console.log(`[API] /api/exams - Found ${result.total} exams (page ${result.page}, showing ${result.exams.length})`)
    
    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    console.error('Failed to fetch exams:', error)
    
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
      statusMessage: error.message || 'Failed to fetch exams'
    })
  }
})