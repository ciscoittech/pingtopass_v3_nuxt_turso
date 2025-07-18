import { useDB } from '~/server/utils/db'
import { studySessions, questions, exams, objectives } from '~/server/database/schema'
import { eq, desc, and, inArray, sql } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  try {
    // Get query parameters
    const query = getQuery(event)
    const examId = query.examId as string | undefined
    const limit = query.limit ? parseInt(query.limit as string) : 50
    const offset = query.offset ? parseInt(query.offset as string) : 0
    
    const db = useDB()
    
    // First, get all bookmarked question IDs from study sessions
    let sessionQuery = db
      .select({
        bookmarks: studySessions.bookmarks,
        examId: studySessions.examId,
        updatedAt: studySessions.updatedAt
      })
      .from(studySessions)
      .where(eq(studySessions.userId, user.id))
    
    // Filter by exam if provided
    if (examId) {
      sessionQuery = sessionQuery.where(eq(studySessions.examId, examId))
    }
    
    const sessions = await sessionQuery
    
    // Extract all unique bookmarked question IDs
    const bookmarkedQuestionIds = new Set<string>()
    const bookmarkMetadata = new Map<string, { examId: string; lastBookmarked: number }>()
    
    sessions.forEach(session => {
      if (session.bookmarks) {
        const bookmarks = JSON.parse(session.bookmarks) as string[]
        bookmarks.forEach(questionId => {
          bookmarkedQuestionIds.add(questionId)
          
          // Track the most recent bookmark time for each question
          const existing = bookmarkMetadata.get(questionId)
          if (!existing || session.updatedAt > existing.lastBookmarked) {
            bookmarkMetadata.set(questionId, {
              examId: session.examId,
              lastBookmarked: session.updatedAt
            })
          }
        })
      }
    })
    
    if (bookmarkedQuestionIds.size === 0) {
      return {
        success: true,
        data: {
          bookmarks: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false
          }
        }
      }
    }
    
    // Get the bookmarked questions with exam and objective info
    const questionIds = Array.from(bookmarkedQuestionIds)
    const questionsData = await db
      .select({
        question: questions,
        exam: {
          id: exams.id,
          name: exams.name,
          code: exams.code
        },
        objective: {
          id: objectives.id,
          title: objectives.title
        }
      })
      .from(questions)
      .innerJoin(exams, eq(questions.examId, exams.id))
      .leftJoin(objectives, eq(questions.objectiveId, objectives.id))
      .where(inArray(questions.id, questionIds))
    
    // Format the results with bookmark metadata
    const formattedBookmarks = questionsData.map(item => {
      const metadata = bookmarkMetadata.get(item.question.id)!
      return {
        id: `bookmark_${item.question.id}`, // Synthetic ID for compatibility
        questionId: item.question.id,
        lastBookmarked: metadata.lastBookmarked,
        question: {
          id: item.question.id,
          questionText: item.question.questionText,
          questionType: item.question.questionType,
          options: item.question.options ? JSON.parse(item.question.options) : [],
          explanation: item.question.explanation,
          examId: item.question.examId,
          isActive: item.question.isActive,
          objective: item.objective
        },
        exam: item.exam
      }
    })
    
    // Sort by most recently bookmarked
    formattedBookmarks.sort((a, b) => b.lastBookmarked - a.lastBookmarked)
    
    // Apply pagination
    const paginatedBookmarks = formattedBookmarks.slice(offset, offset + limit)
    
    return {
      success: true,
      data: {
        bookmarks: paginatedBookmarks,
        pagination: {
          total: formattedBookmarks.length,
          limit,
          offset,
          hasMore: offset + limit < formattedBookmarks.length
        }
      }
    }
  } catch (error: any) {
    console.error('Failed to get bookmarks:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch bookmarks'
    })
  }
})