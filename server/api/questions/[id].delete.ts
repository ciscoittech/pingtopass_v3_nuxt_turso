import { useDB } from '~/server/utils/db'
import { questions } from '~/server/database/schema/questions'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const questionId = getRouterParam(event, 'id')
  
  if (!questionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Question ID is required'
    })
  }
  
  try {
    const db = useDB()
    
    // Check if question exists
    const existingQuestion = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .get()
    
    if (!existingQuestion) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Question not found'
      })
    }
    
    // Delete question (hard delete for now)
    await db
      .delete(questions)
      .where(eq(questions.id, questionId))
    
    return {
      success: true,
      message: 'Question deleted successfully'
    }
  } catch (error: any) {
    console.error('Error deleting question:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete question'
    })
  }
})