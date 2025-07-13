import { useDB } from '~/server/utils/db'
import { questions } from '~/server/database/schema/questions'
import { generateQuestionId } from '~/server/utils/id'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validate required fields
    const errors = []
    if (!body.examId) errors.push('Exam ID is required')
    if (!body.questionText) errors.push('Question text is required')
    if (!body.questionType) errors.push('Question type is required')
    if (!body.options || !Array.isArray(body.options)) errors.push('Options must be an array')
    if (!body.correctAnswer || !Array.isArray(body.correctAnswer)) errors.push('Correct answer must be an array')
    
    if (errors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: errors.join(', ')
      })
    }
    
    const db = useDB()
    
    // Create new question
    const newQuestion = {
      id: generateQuestionId(),
      examId: body.examId,
      objectiveId: body.objectiveId || null,
      questionText: body.questionText,
      questionType: body.questionType,
      options: JSON.stringify(body.options),
      correctAnswer: JSON.stringify(body.correctAnswer),
      explanation: body.explanation || null,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
    }
    
    await db.insert(questions).values(newQuestion)
    
    return {
      success: true,
      data: {
        ...newQuestion,
        options: body.options,
        correctAnswer: body.correctAnswer
      }
    }
  } catch (error: any) {
    console.error('Error creating question:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create question'
    })
  }
})