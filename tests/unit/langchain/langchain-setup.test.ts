import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LangChainClient } from '../../../server/utils/langchain/client'

// Mock environment variables
vi.mock('process', () => ({
  env: {
    LANGCHAIN_API_KEY: 'test-api-key',
    LANGCHAIN_PROJECT: 'pingtopass-test',
    OPENROUTER_API_KEY: 'test-openrouter-key'
  }
}))

describe('LangChain Setup', () => {
  describe('LangChainClient', () => {
    let client: LangChainClient

    beforeEach(() => {
      // Reset any mocks
      vi.clearAllMocks()
    })

    it('should initialize with required configuration', () => {
      // Act
      client = new LangChainClient()

      // Assert
      expect(client).toBeDefined()
      expect(client.isInitialized()).toBe(true)
    })

    it('should throw error if API key is missing', () => {
      // Arrange
      vi.stubEnv('OPENROUTER_API_KEY', '')

      // Act & Assert
      expect(() => new LangChainClient()).toThrow('OPENROUTER_API_KEY is required')
    })

    it('should create a chat model with default settings', () => {
      // Arrange
      client = new LangChainClient()

      // Act
      const model = client.getChatModel()

      // Assert
      expect(model).toBeDefined()
      expect(model.modelName).toBe('google/gemini-2.5-flash-preview-05-20')
      expect(model.temperature).toBe(0.7)
    })

    it('should create a chat model with custom settings', () => {
      // Arrange
      client = new LangChainClient()

      // Act
      const model = client.getChatModel({
        modelName: 'google/gemini-2.5-flash-lite-preview-06-17',
        temperature: 0.5,
        maxTokens: 1000
      })

      // Assert
      expect(model).toBeDefined()
      expect(model.modelName).toBe('google/gemini-2.5-flash-lite-preview-06-17')
      expect(model.temperature).toBe(0.5)
      expect(model.maxTokens).toBe(1000)
    })

    it('should execute a simple prompt', async () => {
      // Arrange
      client = new LangChainClient()
      const prompt = 'Generate a test question about AWS S3'

      // Mock the response
      const mockResponse = {
        content: 'What is the maximum size of an object that can be stored in S3?',
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25
        }
      }

      const model = client.getChatModel()
      vi.spyOn(model, 'invoke').mockResolvedValue(mockResponse)

      // Act
      const result = await client.invoke(prompt)

      // Assert
      expect(result).toBeDefined()
      expect(result.content).toContain('S3')
      expect(result.usage).toBeDefined()
      expect(result.usage.totalTokens).toBe(25)
    })

    it('should handle errors gracefully', async () => {
      // Arrange
      client = new LangChainClient()
      const model = client.getChatModel()
      
      vi.spyOn(model, 'invoke').mockRejectedValue(new Error('API rate limit exceeded'))

      // Act & Assert
      await expect(client.invoke('test prompt')).rejects.toThrow('API rate limit exceeded')
    })

    it('should support streaming responses', async () => {
      // Arrange
      client = new LangChainClient()
      const chunks: string[] = []

      // Mock streaming response
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'What is ' }
          yield { content: 'the maximum ' }
          yield { content: 'S3 object size?' }
        }
      }

      const model = client.getChatModel()
      vi.spyOn(model, 'stream').mockResolvedValue(mockStream as any)

      // Act
      const stream = await client.stream('Generate a question')
      
      for await (const chunk of stream) {
        chunks.push(chunk.content)
      }

      // Assert
      expect(chunks).toHaveLength(3)
      expect(chunks.join('')).toBe('What is the maximum S3 object size?')
    })
  })

  describe('LangSmith Tracing', () => {
    it('should initialize LangSmith tracing when enabled', () => {
      // Arrange
      vi.stubEnv('LANGCHAIN_TRACING_V2', 'true')
      vi.stubEnv('LANGCHAIN_API_KEY', 'test-langsmith-key')
      vi.stubEnv('LANGCHAIN_PROJECT', 'pingtopass-test')

      // Act
      const client = new LangChainClient()

      // Assert
      expect(client.isTracingEnabled()).toBe(true)
      expect(process.env.LANGCHAIN_PROJECT).toBe('pingtopass-test')
    })

    it('should work without tracing when disabled', () => {
      // Arrange
      vi.stubEnv('LANGCHAIN_TRACING_V2', 'false')

      // Act
      const client = new LangChainClient()

      // Assert
      expect(client.isTracingEnabled()).toBe(false)
    })
  })
})