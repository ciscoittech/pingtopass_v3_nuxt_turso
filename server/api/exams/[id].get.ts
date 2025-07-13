import { useDB } from '~/server/utils/db'
import { exams, vendors } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const examId = getRouterParam(event, 'id')
  
  if (!examId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Exam ID is required'
    })
  }

  try {
    const db = useDB()
    
    // Fetch exam with vendor info
    const examResult = await db
      .select({
        id: exams.id,
        examCode: exams.code,
        examName: exams.name,
        description: exams.description,
        vendorId: exams.vendorId,
        vendorName: vendors.name,
        passingScore: exams.passingScore,
        examDuration: exams.duration,
        numberOfQuestions: exams.questionCount,
        isActive: exams.isActive,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
      })
      .from(exams)
      .leftJoin(vendors, eq(exams.vendorId, vendors.id))
      .where(eq(exams.id, examId))
      .get()
    
    if (!examResult) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exam not found'
      })
    }
    
    return {
      success: true,
      data: examResult
    }
  } catch (error) {
    console.error('Error fetching exam:', error)
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch exam details'
    })
  }
})