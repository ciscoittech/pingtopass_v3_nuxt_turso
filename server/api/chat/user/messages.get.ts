import { useDB } from '~/server/utils/db'
import { chatSessions, chatMessages } from '~/server/database/schema'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const query = getQuery(event)
    const sessionId = query.sessionId as string

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required'
      })
    }

    const db = useDB()
    const userId = session.user.id

    // Verify session belongs to user
    const chatSession = await db
      .select()
      .from(chatSessions)
      .where(and(
        eq(chatSessions.id, sessionId),
        eq(chatSessions.userId, userId)
      ))
      .then(rows => rows[0])

    if (!chatSession) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found'
      })
    }

    // Get all messages for the session
    const messages = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt))

    return {
      success: true,
      session: {
        id: chatSession.id,
        title: chatSession.title,
        context: chatSession.context,
        createdAt: chatSession.createdAt
      },
      messages
    }

  } catch (error: any) {
    console.error('Get chat messages error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to get chat messages'
    })
  }
})