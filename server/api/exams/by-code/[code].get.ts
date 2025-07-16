import { useDB } from '~/server/utils/db'
import { exams, vendors } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  
  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Exam code is required'
    })
  }

  const db = useDB()

  try {
    // Get exam by code with vendor information
    const exam = await db
      .select({
        id: exams.id,
        examCode: exams.code,
        examName: exams.name,
        vendorId: exams.vendorId,
        vendorName: vendors.name,
        vendorSlug: vendors.slug,
        description: exams.description,
        passingScore: exams.passingScore,
        totalQuestions: exams.totalQuestions,
        examDuration: exams.examDuration,
        price: exams.price,
        isActive: exams.isActive,
        metadata: exams.metadata
      })
      .from(exams)
      .leftJoin(vendors, eq(exams.vendorId, vendors.id))
      .where(eq(exams.code, code))
      .get()

    if (!exam) {
      throw createError({
        statusCode: 404,
        statusMessage: `Exam not found: ${code}`
      })
    }

    return {
      success: true,
      data: exam
    }

  } catch (error) {
    console.error('Error fetching exam by code:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch exam'
    })
  }
})