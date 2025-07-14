import { useDB } from '~/server/utils/db'
import { chatSessions, chatMessages, modelSettings } from '~/server/database/schema'
import { eq, and, desc } from 'drizzle-orm'
import { ChatAgent } from '~/server/utils/chatAgent'
import { calculateCost } from '~/server/utils/modelRegistry'
import { getToolDefinitions, executeTool } from '~/server/utils/adminTools'

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

    // Check admin role
    if (!session.user.role || session.user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const body = await readBody(event)
    const { sessionId, message, enableTools = true } = body

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
      // Create new admin session
      const newSessionId = `admin_chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await db.insert(chatSessions).values({
        id: newSessionId,
        userId,
        title: `Admin: ${message.substring(0, 40)}...`,
        context: 'admin',
        isActive: true
      })
      chatSessionId = newSessionId
    } else {
      // Verify session belongs to admin user
      const existingSession = await db
        .select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.id, chatSessionId),
          eq(chatSessions.userId, userId),
          eq(chatSessions.context, 'admin')
        ))
        .then(rows => rows[0])

      if (!existingSession) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Admin session not found'
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
      .then(rows => rows.reverse())

    // Get model settings for admin chat
    const modelSetting = await db
      .select()
      .from(modelSettings)
      .where(eq(modelSettings.feature, 'chat_admin'))
      .then(rows => rows[0])

    const modelId = modelSetting?.modelId || 'openai/gpt-4o'

    // Create chat agent with admin context
    const agent = new ChatAgent({
      modelId,
      enableTools,
      systemPrompt: ChatAgent.createSystemPrompt({
        isAdmin: true
      })
    })

    // Format messages for agent
    const messages = ChatAgent.formatChatHistory(chatHistory)
    messages.push({ role: 'user', content: message })

    // Get available tools if enabled
    const tools = enableTools ? getToolDefinitions() : undefined

    // Get AI response with tool calling support
    let aiResponse
    let toolCallResults: any[] = []
    
    try {
      if (enableTools && tools) {
        // Use chatWithTools for full tool execution flow
        aiResponse = await agent.chatWithTools(
          messages,
          tools,
          async (toolName: string, args: any) => {
            const result = await executeTool(toolName, args)
            toolCallResults.push({ tool: toolName, args, result })
            return result
          }
        )
      } else {
        // Regular chat without tools
        const response = await agent.chat(messages)
        aiResponse = {
          content: response.content || '',
          usage: response.usage
        }
      }
    } catch (error: any) {
      console.error('Admin chat agent error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to process admin chat message'
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

    // Calculate and log cost
    const usageData = aiResponse.totalUsage || aiResponse.usage
    if (usageData) {
      const cost = calculateCost(
        modelId,
        usageData.prompt_tokens,
        usageData.completion_tokens
      )
      console.log(`Admin chat cost: $${cost.toFixed(4)} for admin ${userId}`)
      
      // Log if prompt caching was used
      if (usageData.prompt_tokens_details?.cached_tokens) {
        console.log(`Cached tokens used: ${usageData.prompt_tokens_details.cached_tokens}`)
      }
    }

    // Add tool information to response
    const responseData: any = {
      success: true,
      sessionId: chatSessionId,
      message: {
        role: 'assistant',
        content: aiResponse.content
      },
      usage: usageData
    }

    if (enableTools && tools) {
      responseData.availableTools = tools.map(t => t.name)
    }

    if (toolCallResults.length > 0) {
      responseData.toolCalls = toolCallResults
    }

    return responseData

  } catch (error: any) {
    console.error('Admin chat error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to send admin message'
    })
  }
})