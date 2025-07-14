import { useDB } from '~/server/utils/db'
import { chatSessions, chatMessages, modelSettings } from '~/server/database/schema'
import { eq, and, desc } from 'drizzle-orm'
import { ChatAgent } from '~/server/utils/chatAgent'
import { calculateCost } from '~/server/utils/modelRegistry'

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

    const body = await readBody(event)
    const { sessionId, message } = body

    // Validate input
    if (!message || message.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Message is required'
      })
    }

    const db = useDB()
    const userId = session.user.id
    let chatSessionId = sessionId

    // Get or create chat session
    if (!chatSessionId) {
      // Create new session
      const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await db.insert(chatSessions).values({
        id: newSessionId,
        userId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        context: 'general',
        isActive: true
      })
      chatSessionId = newSessionId
    } else {
      // Verify session belongs to user
      const existingSession = await db
        .select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.id, chatSessionId),
          eq(chatSessions.userId, userId)
        ))
        .then(rows => rows[0])

      if (!existingSession) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Session not found'
        })
      }
    }

    // Save user message
    const userMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.insert(chatMessages).values({
      id: userMessageId,
      userId,
      sessionId: chatSessionId,
      role: 'user',
      content: message
    })

    // Get chat history (last 20 messages)
    const chatHistory = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, chatSessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(20)
      .then(rows => rows.reverse()) // Reverse to get chronological order

    // Get model settings for user chat
    const modelSetting = await db
      .select()
      .from(modelSettings)
      .where(eq(modelSettings.feature, 'chat_user'))
      .then(rows => rows[0])

    const modelId = modelSetting?.modelId || 'deepseek/deepseek-chat'

    // Create chat agent
    const agent = new ChatAgent({
      modelId,
      systemPrompt: ChatAgent.createSystemPrompt({
        isAdmin: false,
        // TODO: Add exam context if user is studying specific exam
        // TODO: Add user progress summary
      })
    })

    // Format messages for agent
    const messages = ChatAgent.formatChatHistory(chatHistory)
    messages.push({ role: 'user', content: message })

    // Get AI response
    let aiResponse
    try {
      aiResponse = await agent.chat(messages)
    } catch (error: any) {
      console.error('Chat agent error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to process chat message'
      })
    }

    // Save assistant message
    const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.insert(chatMessages).values({
      id: assistantMessageId,
      userId,
      sessionId: chatSessionId,
      role: 'assistant',
      content: aiResponse.content
    })

    // Calculate and log cost if usage data is available
    if (aiResponse.usage) {
      const cost = calculateCost(
        modelId,
        aiResponse.usage.prompt_tokens,
        aiResponse.usage.completion_tokens
      )
      console.log(`Chat cost: $${cost.toFixed(4)} for user ${userId}`)
    }

    return {
      success: true,
      sessionId: chatSessionId,
      message: {
        role: 'assistant',
        content: aiResponse.content
      },
      usage: aiResponse.usage
    }

  } catch (error: any) {
    console.error('User chat error:', error)
    
    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to send message'
    })
  }
})