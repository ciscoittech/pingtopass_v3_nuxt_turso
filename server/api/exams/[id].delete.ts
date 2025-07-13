import { useDB } from '~/server/utils/db'
import { exams, questions } from '~/server/database/schema'
import { eq, sql } from 'drizzle-orm'

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
    
    // Check if exam has questions
    const examQuestions = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(eq(questions.examId, examId))
      .get()
    
    if (examQuestions && examQuestions.count > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot delete exam with existing questions'
      })
    }
    
    // Delete exam
    await db
      .delete(exams)
      .where(eq(exams.id, examId))
    
    return {
      success: true,
      message: 'Exam deleted successfully'
    }
  } catch (error: any) {
    console.error('Error deleting exam:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete exam'
    })
  }
})