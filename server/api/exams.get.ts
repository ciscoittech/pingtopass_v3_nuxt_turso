import { useDB } from '~/server/utils/db'
import { exams, vendors } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    
    // Fetch all active exams with vendor information
    const allExams = await db
      .select({
        id: exams.id,
        vendorId: exams.vendorId,
        code: exams.code,
        name: exams.name,
        description: exams.description,
        passingScore: exams.passingScore,
        questionCount: exams.questionCount,
        duration: exams.duration,
        price: exams.price,
        isActive: exams.isActive,
        vendor: {
          id: vendors.id,
          name: vendors.name
        }
      })
      .from(exams)
      .leftJoin(vendors, eq(exams.vendorId, vendors.id))
      .where(eq(exams.isActive, true))
      .all()

    console.log(`[API] /api/exams - Found ${allExams.length} active exams`)
    
    return {
      success: true,
      data: allExams
    }
  } catch (error: any) {
    console.error('Failed to fetch exams:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch exams'
    })
  }
})