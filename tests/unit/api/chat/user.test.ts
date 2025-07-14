import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEvent } from 'h3'
import handler from '~/server/api/chat/user/send.post'
import { useDB } from '~/server/utils/db'
import { ChatAgent } from '~/server/utils/chatAgent'

// Mock dependencies
vi.mock('~/server/utils/db')
vi.mock('~/server/utils/chatAgent')

const mockGetUserSession = vi.fn()
vi.mock('#imports', () => ({
  getUserSession: () => mockGetUserSession(),
  readBody: vi.fn(),
  createError: (error: any) => new Error(error.statusMessage)
}))

describe('/api/chat/user/send', () => {
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
      url: '/api/chat/user/send'
    })
  })

  it('should require authentication', async () => {
    mockGetUserSession.mockResolvedValue({ user: null })
    
    await expect(handler(mockEvent)).rejects.toThrow('Authentication required')
  })

  it('should create new session if sessionId not provided', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({
      message: 'Hello, I need help studying'
    })

    // Mock database responses
    mockDb.then
      .mockResolvedValueOnce([]) // No existing session
      .mockResolvedValueOnce([{ id: 'session123' }]) // Create session
      .mockResolvedValueOnce([{ id: 'msg123' }]) // Save user message
      .mockResolvedValueOnce([]) // No chat history
      .mockResolvedValueOnce([{ modelId: 'deepseek/deepseek-chat' }]) // Model settings

    // Mock ChatAgent
    const mockChat = vi.fn().mockResolvedValue({
      content: 'Hello! I\'d be happy to help you study.',
      usage: { prompt_tokens: 50, completion_tokens: 20 }
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
        content: 'Hello! I\'d be happy to help you study.'
      },
      usage: { prompt_tokens: 50, completion_tokens: 20 }
    })
  })

  it('should use existing session when sessionId is provided', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user123' } })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({
      sessionId: 'existing-session',
      message: 'What is AWS Lambda?'
    })

    // Mock database responses
    mockDb.then
      .mockResolvedValueOnce([{ id: 'existing-session', userId: 'user123' }]) // Existing session
      .mockResolvedValueOnce([{ id: 'msg123' }]) // Save user message
      .mockResolvedValueOnce([ // Chat history
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ])
      .mockResolvedValueOnce([{ modelId: 'deepseek/deepseek-chat' }]) // Model settings

    // Mock ChatAgent
    const mockChat = vi.fn().mockResolvedValue({
      content: 'AWS Lambda is a serverless compute service...',
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    })
    vi.mocked(ChatAgent).mockImplementation(() => ({
      chat: mockChat
    } as any))

    const response = await handler(mockEvent)

    expect(mockChat).toHaveBeenCalledWith([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'What is AWS Lambda?' }
    ])

    expect(response.sessionId).toBe('existing-session')
  })

  it('should prevent access to other users sessions', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user123' } })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({
      sessionId: 'other-user-session',
      message: 'Hello'
    })

    // Mock database response - session belongs to different user
    mockDb.then.mockResolvedValueOnce([{ id: 'other-user-session', userId: 'user456' }])

    await expect(handler(mockEvent)).rejects.toThrow('Session not found')
  })

  it('should validate message content', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user123' } })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({
      message: '' // Empty message
    })

    await expect(handler(mockEvent)).rejects.toThrow('Message is required')
  })

  it('should handle chat errors gracefully', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user123' } })
    
    const mockReadBody = vi.mocked(await import('#imports').then(m => m.readBody))
    mockReadBody.mockResolvedValue({
      message: 'Hello'
    })

    // Mock database responses
    mockDb.then
      .mockResolvedValueOnce([]) // No existing session
      .mockResolvedValueOnce([{ id: 'session123' }]) // Create session
      .mockResolvedValueOnce([{ id: 'msg123' }]) // Save user message
      .mockResolvedValueOnce([]) // No chat history
      .mockResolvedValueOnce([{ modelId: 'deepseek/deepseek-chat' }]) // Model settings

    // Mock ChatAgent to throw error
    vi.mocked(ChatAgent).mockImplementation(() => ({
      chat: vi.fn().mockRejectedValue(new Error('OpenRouter API error'))
    } as any))

    await expect(handler(mockEvent)).rejects.toThrow('Failed to process chat message')
  })
})