import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChatAgent } from '../../../server/utils/chatAgent'
import { openRouterClient } from '../../../server/utils/openrouter'
import * as modelRegistry from '../../../server/utils/modelRegistry'

// Mock the dependencies
vi.mock('../../../server/utils/openrouter', () => ({
  openRouterClient: {
    chat: vi.fn()
  }
}))

vi.mock('../../../server/utils/modelRegistry', () => ({
  getModelById: vi.fn()
}))

describe('ChatAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      const agent = new ChatAgent({
        modelId: 'test-model',
        enableTools: true,
        systemPrompt: 'Test prompt',
        maxTokens: 1000,
        temperature: 0.5
      })

      expect(agent).toBeDefined()
    })

    it('should use default values when options are not provided', () => {
      const agent = new ChatAgent({
        modelId: 'test-model'
      })

      expect(agent).toBeDefined()
    })
  })

  describe('chat method', () => {
    it('should call OpenRouter with correct parameters', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 }
      }
      
      vi.mocked(openRouterClient.chat).mockResolvedValue(mockResponse as any)

      const agent = new ChatAgent({
        modelId: 'test-model',
        systemPrompt: 'System prompt'
      })

      const result = await agent.chat([
        { role: 'user', content: 'Hello' }
      ])

      expect(openRouterClient.chat).toHaveBeenCalledWith({
        model: 'test-model',
        messages: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })

      expect(result).toEqual({
        content: 'Test response',
        usage: { prompt_tokens: 10, completion_tokens: 5 }
      })
    })

    it('should throw error when tools are provided but model does not support them', async () => {
      vi.mocked(modelRegistry.getModelById).mockReturnValue({
        provider: 'test',
        name: 'Test Model',
        capabilities: { toolCalling: false, streaming: true },
        cost: { input: 1, output: 1 },
        speed: 'fast',
        quality: 'good'
      })

      const agent = new ChatAgent({
        modelId: 'test-model',
        enableTools: true
      })

      const tools = [{
        name: 'test-tool',
        description: 'Test tool',
        parameters: {}
      }]

      await expect(agent.chat([], tools)).rejects.toThrow(
        'Model test-model does not support tool calling'
      )
    })

    it('should not include system prompt when not provided', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: {}
      }
      
      vi.mocked(openRouterClient.chat).mockResolvedValue(mockResponse as any)

      const agent = new ChatAgent({
        modelId: 'test-model'
      })

      await agent.chat([{ role: 'user', content: 'Hello' }])

      expect(openRouterClient.chat).toHaveBeenCalledWith({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 2000,
        temperature: 0.7
      })
    })
  })

  describe('formatChatHistory', () => {
    it('should format chat messages correctly', () => {
      const dbMessages = [
        {
          id: '1',
          userId: 'user1',
          sessionId: 'session1',
          role: 'user',
          content: 'Hello',
          createdAt: '2024-01-01'
        },
        {
          id: '2',
          userId: 'user1',
          sessionId: 'session1',
          role: 'assistant',
          content: 'Hi there!',
          createdAt: '2024-01-01'
        }
      ]

      const formatted = ChatAgent.formatChatHistory(dbMessages as any)

      expect(formatted).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ])
    })

    it('should handle empty content', () => {
      const dbMessages = [
        {
          id: '1',
          role: 'user',
          content: null
        }
      ]

      const formatted = ChatAgent.formatChatHistory(dbMessages as any)

      expect(formatted).toEqual([
        { role: 'user', content: '' }
      ])
    })
  })

  describe('createSystemPrompt', () => {
    it('should create admin system prompt', () => {
      const prompt = ChatAgent.createSystemPrompt({
        isAdmin: true
      })

      expect(prompt).toContain('AI assistant for PingToPass administrators')
      expect(prompt).toContain('access to system data')
    })

    it('should create user system prompt with exam context', () => {
      const prompt = ChatAgent.createSystemPrompt({
        isAdmin: false,
        examContext: 'AWS Solutions Architect',
        userProgress: { score: 85 }
      })

      expect(prompt).toContain('helpful AI study assistant')
      expect(prompt).toContain('AWS Solutions Architect')
      expect(prompt).toContain('"score":85')
    })

    it('should create basic user prompt without context', () => {
      const prompt = ChatAgent.createSystemPrompt({
        isAdmin: false
      })

      expect(prompt).toContain('helpful AI study assistant')
      expect(prompt).not.toContain('currently studying for')
      expect(prompt).not.toContain('User progress')
    })
  })
})