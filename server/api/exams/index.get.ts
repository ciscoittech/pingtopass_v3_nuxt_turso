import { useDB } from '~/server/utils/db'
import { exams, vendors } from '~/server/database/schema'
import { eq, desc, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    
    // Get query parameters for filtering
    const query = getQuery(event)
    const vendorId = query.vendor as string
    
    // Build where conditions
    const conditions = [eq(exams.isActive, true)]
    if (vendorId) {
      conditions.push(eq(exams.vendorId, vendorId))
    }
    
    // Build and execute query
    const results = await db
      .select({
        id: exams.id,
        examCode: exams.code,
        examName: exams.name,
        vendorId: exams.vendorId,
        vendorName: vendors.name,
        passingScore: exams.passingScore,
        examDuration: exams.duration,
        numberOfQuestions: exams.questionCount,
        isActive: exams.isActive,
        updatedAt: exams.updatedAt,
      })
      .from(exams)
      .leftJoin(vendors, eq(exams.vendorId, vendors.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(exams.updatedAt))
      .all()
    
    return {
      success: true,
      data: results
    }
  } catch (error) {
    console.error('Error fetching exams:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch exams'
    })
  }
})