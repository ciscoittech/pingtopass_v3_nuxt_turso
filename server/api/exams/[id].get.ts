import { examService } from '~/server/utils/examService'
import type { ExamDetailResponse } from '~/server/utils/types/examTypes'

export default defineEventHandler(async (event): Promise<ExamDetailResponse> => {
  const examIdOrCode = getRouterParam(event, 'id')
  const user = event.context.user
  
  console.log('[Exam API] Fetching exam:', examIdOrCode)
  
  if (!examIdOrCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Exam ID or code is required'
    })
  }

  try {
    // Check if it's an exam code (contains hyphen) or ID
    const isCode = examIdOrCode.includes('-')
    
    // Get exam details using the appropriate method
    const examDetails = isCode 
      ? await examService.getByCode(examIdOrCode)
      : await examService.getById(examIdOrCode, user?.id)
    
    console.log('[Exam API] Raw exam details:', examDetails)
    
    if (!examDetails) {
      throw createError({
        statusCode: 404,
        statusMessage: `Exam '${examIdOrCode}' not found`
      })
    }
    
    // Check if exam is active
    if (!examDetails.isActive && !user?.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'This exam is not currently available'
      })
    }
    
    // Transform to match frontend expectations
    const transformedData = {
      ...examDetails,
      examCode: examDetails.code,
      examName: examDetails.name
    }
    
    console.log('[Exam API] Transformed exam data:', transformedData)
    
    return {
      success: true,
      data: transformedData
    }
  } catch (error: any) {
    console.error('Error fetching exam:', error)
    
    // Re-throw if it's already a proper error
    if (error.statusCode) throw error
    
    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch exam details'
    })
  }
})