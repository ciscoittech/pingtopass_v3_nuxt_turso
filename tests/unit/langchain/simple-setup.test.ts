import { describe, it, expect, vi } from 'vitest'

// Set up environment variables before importing
process.env.OPENROUTER_API_KEY = 'test-api-key'
process.env.LANGCHAIN_API_KEY = 'test-langsmith-key'
process.env.LANGCHAIN_PROJECT = 'pingtopass-test'

describe('Simple LangChain Setup Test', () => {
  it('should create LangChainClient with mocked environment', async () => {
    // Dynamic import after setting env vars
    const { LangChainClient } = await import('../../../server/utils/langchain/client')
    
    const client = new LangChainClient()
    expect(client).toBeDefined()
    expect(client.isInitialized()).toBe(true)
  })

  it('should verify QuestionGenerator can be instantiated', async () => {
    // Dynamic import
    const { QuestionGenerator } = await import('../../../server/utils/langchain/agents/generator')
    
    const generator = new QuestionGenerator()
    expect(generator).toBeDefined()
  })
})