import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEvent } from 'h3'
import handler from '~/server/api/chat/admin/send.post'
import { useDB } from '~/server/utils/db'
import { ChatAgent } from '~/server/utils/chatAgent'
import * as adminTools from '~/server/utils/adminTools'

// Mock dependencies
vi.mock('~/server/utils/db')
vi.mock('~/server/utils/chatAgent')
vi.mock('~/server/utils/adminTools')

const mockGetUserSession = vi.fn()
vi.mock('#imports', () => ({
  getUserSession: () => mockGetUserSession(),
  readBody: vi.fn(),
  createError: (error: any) => new Error(error.statusMessage)
}))

describe('/api/chat/admin/send', () => {
  let mockDb: any
  let mockEvent: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock database
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn()
    }
    
    vi.mocked(useDB).mockReturnValue(mockDb)
    
    // Setup mock event
    mockEvent = createEvent({
      method: 'POST',
      url: '/api/chat/admin/send'
    })
  })

  it('should require authentication', async () => {
    mockGetUserSession.mockResolvedValue({ user: null })
    
    await expect(handler(mockEvent)).rejects.toThrow('Authentication required')
  })

  it('should require admin role', async () => {
    mockGetUserSession.mockResolvedValue({ 
      user: { 
        id: 'user123', 
        email: 'user@example.com',
        role: 'user' // Not admin
      } 
    })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({ message: 'Hello' })

    await expect(handler(mockEvent)).rejects.toThrow('Admin access required')
  })

  it('should process message without tool calls', async () => {
    mockGetUserSession.mockResolvedValue({ 
      user: { 
        id: 'admin123', 
        email: 'admin@example.com',
        role: 'admin'
      } 
    })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({
      message: 'How many users do we have?'
    })

    // Mock database responses
    mockDb.then
      .mockResolvedValueOnce([]) // No existing session
      .mockResolvedValueOnce([{ id: 'session123' }]) // Create session
      .mockResolvedValueOnce([{ id: 'msg123' }]) // Save user message
      .mockResolvedValueOnce([]) // No chat history
      .mockResolvedValueOnce([{ modelId: 'openai/gpt-4o' }]) // Model settings

    // Mock ChatAgent response (simulating tool suggestion without actual call)
    const mockChat = vi.fn().mockResolvedValue({
      content: 'I can check that for you. Let me query the database to get the total number of users.',
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    })
    vi.mocked(ChatAgent).mockImplementation(() => ({
      chat: mockChat
    } as any))

    const response = await handler(mockEvent)

    expect(response).toEqual({
      success: true,
      sessionId: 'session123',
      message: {
        role: 'assistant',
        content: 'I can check that for you. Let me query the database to get the total number of users.'
      },
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    })
  })

  it('should handle tool calls in response', async () => {
    mockGetUserSession.mockResolvedValue({ 
      user: { 
        id: 'admin123', 
        email: 'admin@example.com',
        role: 'admin'
      } 
    })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({
      message: 'Get user statistics',
      enableTools: true
    })

    // Mock database responses
    mockDb.then
      .mockResolvedValueOnce([]) // No existing session
      .mockResolvedValueOnce([{ id: 'session123' }]) // Create session
      .mockResolvedValueOnce([{ id: 'msg123' }]) // Save user message
      .mockResolvedValueOnce([]) // No chat history
      .mockResolvedValueOnce([{ modelId: 'openai/gpt-4o' }]) // Model settings

    // Mock tool execution
    vi.mocked(adminTools.executeTool).mockResolvedValue({
      success: true,
      data: { totalUsers: 150, activeUsers: 45 }
    })

    // Mock ChatAgent with simulated tool response
    const mockChat = vi.fn().mockResolvedValue({
      content: 'Here are the user statistics:\n- Total users: 150\n- Active users (last 7 days): 45',
      usage: { prompt_tokens: 150, completion_tokens: 100 }
    })
    vi.mocked(ChatAgent).mockImplementation(() => ({
      chat: mockChat
    } as any))

    const response = await handler(mockEvent)

    expect(response.message.content).toContain('user statistics')
  })

  it('should pass available tools to chat agent when tools are enabled', async () => {
    mockGetUserSession.mockResolvedValue({ 
      user: { 
        id: 'admin123', 
        email: 'admin@example.com',
        role: 'admin'
      } 
    })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({
      message: 'Show me database stats',
      enableTools: true
    })

    // Mock all database calls
    mockDb.then
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'session123' }])
      .mockResolvedValueOnce([{ id: 'msg123' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ modelId: 'openai/gpt-4o' }])

    // Mock getToolDefinitions
    vi.mocked(adminTools.getToolDefinitions).mockReturnValue([
      {
        name: 'getDatabaseStats',
        description: 'Get database statistics',
        parameters: {}
      }
    ])

    const mockChat = vi.fn().mockResolvedValue({
      content: 'Database statistics retrieved.',
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    })
    vi.mocked(ChatAgent).mockImplementation(() => ({
      chat: mockChat
    } as any))

    await handler(mockEvent)

    // Verify that tools were passed to the chat method
    expect(mockChat).toHaveBeenCalledWith(
      expect.any(Array),
      expect.arrayContaining([
        expect.objectContaining({
          name: 'getDatabaseStats'
        })
      ])
    )
  })

  it('should handle tool execution errors gracefully', async () => {
    mockGetUserSession.mockResolvedValue({ 
      user: { 
        id: 'admin123', 
        email: 'admin@example.com',
        role: 'admin'
      } 
    })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({
      message: 'Get invalid data',
      enableTools: true
    })

    // Mock database responses
    mockDb.then
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'session123' }])
      .mockResolvedValueOnce([{ id: 'msg123' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ modelId: 'openai/gpt-4o' }])

    // Mock tool execution failure
    vi.mocked(adminTools.executeTool).mockResolvedValue({
      success: false,
      error: 'Database connection failed'
    })

    const mockChat = vi.fn().mockResolvedValue({
      content: 'I encountered an error accessing the database. Please try again later.',
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    })
    vi.mocked(ChatAgent).mockImplementation(() => ({
      chat: mockChat
    } as any))

    const response = await handler(mockEvent)
    
    expect(response.success).toBe(true)
    expect(response.message.content).toContain('error')
  })
})