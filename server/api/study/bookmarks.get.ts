import { db } from '~/server/database/db'
import { bookmarks, questions, exams } from '~/server/database/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Get query parameters
    const query = getQuery(event)
    const examId = query.examId as string | undefined
    const limit = query.limit ? parseInt(query.limit as string) : 50
    const offset = query.offset ? parseInt(query.offset as string) : 0

    // Base query to get bookmarked questions
    let dbQuery = db
      .select({
        bookmark: bookmarks,
        question: {
          id: questions.id,
          questionText: questions.questionText,
          questionType: questions.questionType,
          options: questions.options,
          explanation: questions.explanation,
          examId: questions.examId,
          difficultyLevel: questions.difficultyLevel,
          isActive: questions.isActive
        },
        exam: {
          id: exams.id,
          name: exams.name,
          code: exams.code
        }
      })
      .from(bookmarks)
      .innerJoin(questions, eq(bookmarks.questionId, questions.id))
      .innerJoin(exams, eq(questions.examId, exams.id))
      .where(eq(bookmarks.userId, session.user.id))

    // Filter by exam if provided
    if (examId) {
      dbQuery = dbQuery.where(eq(questions.examId, examId))
    }

    // Apply ordering, limit, and offset
    const bookmarkedQuestions = await dbQuery
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalQuery = db
      .select({ count: questions.id })
      .from(bookmarks)
      .innerJoin(questions, eq(bookmarks.questionId, questions.id))
      .where(eq(bookmarks.userId, session.user.id))

    if (examId) {
      totalQuery.where(eq(questions.examId, examId))
    }

    const totalCount = await totalQuery

    return {
      success: true,
      data: {
        bookmarks: bookmarkedQuestions.map(item => ({
          id: item.bookmark.id,
          questionId: item.question.id,
          notes: item.bookmark.notes,
          createdAt: item.bookmark.createdAt,
          question: {
            ...item.question,
            options: item.question.options ? JSON.parse(item.question.options) : []
          },
          exam: item.exam
        })),
        pagination: {
          total: totalCount.length,
          limit,
          offset,
          hasMore: offset + limit < totalCount.length
        }
      }
    }

  } catch (error) {
    console.error('Get bookmarks error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})