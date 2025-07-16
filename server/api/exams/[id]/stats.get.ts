import { examService } from '~/server/utils/examService'
import type { ExamStatsResponse } from '~/server/utils/types/examTypes'

export default defineEventHandler(async (event): Promise<ExamStatsResponse> => {
  const examId = getRouterParam(event, 'id')
  
  if (!examId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Exam ID is required'
    })
  }

  try {
    // Get exam statistics
    const statistics = await examService.getStatistics(examId)
    
    console.log(`[API] /api/exams/${examId}/stats - Retrieved statistics`)
    
    return {
      success: true,
      data: statistics
    }
  } catch (error: any) {
    console.error('Failed to fetch exam statistics:', error)
    
    // Re-throw if it's already a proper error
    if (error.statusCode) throw error
    
    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch exam statistics'
    })
  }
})