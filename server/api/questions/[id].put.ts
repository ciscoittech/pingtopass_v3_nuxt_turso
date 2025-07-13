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
    const body = await readBody(event)
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
    
    // Parse existing JSON fields
    const existingOptions = existingQuestion.options ? JSON.parse(existingQuestion.options) : []
    const existingCorrectAnswer = existingQuestion.correctAnswer ? JSON.parse(existingQuestion.correctAnswer) : []
    
    // Update question
    const updates = {
      examId: body.examId ?? existingQuestion.examId,
      objectiveId: body.objectiveId ?? existingQuestion.objectiveId,
      questionText: body.questionText ?? existingQuestion.questionText,
      questionType: body.questionType ?? existingQuestion.questionType,
      options: body.options ? JSON.stringify(body.options) : existingQuestion.options,
      correctAnswer: body.correctAnswer ? JSON.stringify(body.correctAnswer) : existingQuestion.correctAnswer,
      explanation: body.explanation ?? existingQuestion.explanation,
      isActive: body.isActive ?? existingQuestion.isActive,
    }
    
    await db
      .update(questions)
      .set(updates)
      .where(eq(questions.id, questionId))
    
    return {
      success: true,
      data: {
        ...existingQuestion,
        ...updates,
        options: body.options || existingOptions,
        correctAnswer: body.correctAnswer || existingCorrectAnswer
      }
    }
  } catch (error: any) {
    console.error('Error updating question:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update question'
    })
  }
})