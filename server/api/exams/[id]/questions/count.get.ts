import { useDB, useDBClient } from '~/server/utils/db'
import { questions, exams } from '~/server/database/schema'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const examId = getRouterParam(event, 'id')
    
    console.log('[Question Count API] Fetching count for exam:', examId)
    
    if (!examId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Exam ID is required'
      })
    }

    const db = useDB()
    const client = useDBClient()
    
    // First check if exam exists
    const exam = await db
      .select({ id: exams.id })
      .from(exams)
      .where(eq(exams.id, examId))
      .get()
    
    if (!exam) {
      console.error('[Question Count API] Exam not found:', examId)
      throw createError({
        statusCode: 404,
        statusMessage: 'Exam not found'
      })
    }

    // Count questions for this exam - using raw SQL to handle column name
    const result = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM questions WHERE exam_id = ? AND is_active = 1',
      args: [examId]
    })
    
    const count = result.rows[0]?.count || 0
    console.log('[Question Count API] Found questions:', count)

    return {
      success: true,
      data: {
        examId,
        count: Number(count)
      }
    }
    
  } catch (error: any) {
    console.error('Error fetching question count:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch question count'
    })
  }
})