import { useDB } from '~/server/utils/db'
import { questions, exams, objectives } from '~/server/database/schema'
import { eq, desc, and, like, or } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    
    // Get query parameters
    const query = getQuery(event)
    const examId = query.examId as string
    const objectiveId = query.objectiveId as string
    const search = query.search as string
    const questionType = query.questionType as string
    const activeOnly = query.activeOnly === 'true'
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0
    
    // Build where conditions
    const conditions = []
    
    if (examId) {
      conditions.push(eq(questions.examId, examId))
    }
    
    if (objectiveId) {
      conditions.push(eq(questions.objectiveId, objectiveId))
    }
    
    if (search) {
      conditions.push(
        or(
          like(questions.questionText, `%${search}%`),
          like(questions.explanation, `%${search}%`)
        )
      )
    }
    
    if (questionType) {
      conditions.push(eq(questions.questionType, questionType))
    }
    
    if (activeOnly) {
      conditions.push(eq(questions.isActive, true))
    }
    
    // Execute query
    const results = await db
      .select({
        id: questions.id,
        examId: questions.examId,
        objectiveId: questions.objectiveId,
        questionText: questions.questionText,
        questionType: questions.questionType,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        isActive: questions.isActive,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .limit(limit)
      .offset(offset)
      .all()
    
    // Parse JSON fields with error handling
    const parsedResults = results.map(q => {
      let options = []
      let correctAnswer = []
      
      try {
        options = q.options ? JSON.parse(q.options) : []
      } catch (e) {
        console.warn('Invalid JSON in options field:', q.options)
        options = []
      }
      
      try {
        correctAnswer = q.correctAnswer ? JSON.parse(q.correctAnswer) : []
      } catch (e) {
        console.warn('Invalid JSON in correctAnswer field:', q.correctAnswer)
        correctAnswer = []
      }
      
      return {
        ...q,
        options,
        correctAnswer
      }
    })
    
    return {
      success: true,
      data: parsedResults,
      pagination: {
        limit,
        offset,
        total: parsedResults.length
      }
    }
  } catch (error) {
    console.error('Error fetching questions:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch questions'
    })
  }
})