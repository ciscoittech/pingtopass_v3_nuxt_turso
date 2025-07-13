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
    
    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .get()
    
    if (!question) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Question not found'
      })
    }
    
    // Parse JSON fields
    const parsedQuestion = {
      ...question,
      options: question.options ? JSON.parse(question.options) : [],
      correctAnswer: question.correctAnswer ? JSON.parse(question.correctAnswer) : []
    }
    
    return {
      success: true,
      data: parsedQuestion
    }
  } catch (error: any) {
    console.error('Error fetching question:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch question'
    })
  }
})