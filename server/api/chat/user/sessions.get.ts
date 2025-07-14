import { useDB } from '~/server/utils/db'
import { chatSessions, chatMessages } from '~/server/database/schema'
import { eq, desc, sql } from 'drizzle-orm'

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

    const db = useDB()
    const userId = session.user.id

    // Get all chat sessions for user with last message
    const sessions = await db
      .select({
        id: chatSessions.id,
        title: chatSessions.title,
        context: chatSessions.context,
        isActive: chatSessions.isActive,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
        lastMessage: sql<string>`(
          SELECT content 
          FROM chat_messages 
          WHERE chat_messages.session_id = chat_sessions.id 
          ORDER BY chat_messages.created_at DESC 
          LIMIT 1
        )`,
        messageCount: sql<number>`(
          SELECT COUNT(*) 
          FROM chat_messages 
          WHERE chat_messages.session_id = chat_sessions.id
        )`
      })
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt))

    return {
      success: true,
      sessions: sessions.map(session => ({
        ...session,
        lastMessage: session.lastMessage || 'No messages yet',
        messageCount: Number(session.messageCount) || 0
      }))
    }

  } catch (error: any) {
    console.error('Get chat sessions error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to get chat sessions'
    })
  }
})