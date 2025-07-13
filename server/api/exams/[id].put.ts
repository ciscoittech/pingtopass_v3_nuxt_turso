import { useDB } from '~/server/utils/db'
import { exams } from '~/server/database/schema/exams'
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
    const body = await readBody(event)
    const db = useDB()
    
    // Check if exam exists
    const existingExam = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId))
      .get()
    
    if (!existingExam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exam not found'
      })
    }
    
    // Update exam
    const updates = {
      vendorId: body.vendorId ?? existingExam.vendorId,
      code: body.code ?? existingExam.code,
      name: body.name ?? existingExam.name,
      description: body.description ?? existingExam.description,
      passingScore: body.passingScore ?? existingExam.passingScore,
      questionCount: body.questionCount ?? existingExam.questionCount,
      duration: body.duration ?? existingExam.duration,
      price: body.price ?? existingExam.price,
      isActive: body.isActive ?? existingExam.isActive,
      updatedAt: Math.floor(Date.now() / 1000),
    }
    
    await db
      .update(exams)
      .set(updates)
      .where(eq(exams.id, examId))
    
    return {
      success: true,
      data: {
        ...existingExam,
        ...updates
      }
    }
  } catch (error: any) {
    console.error('Error updating exam:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update exam'
    })
  }
})