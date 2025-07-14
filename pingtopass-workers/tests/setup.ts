import { vi } from 'vitest'

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock OpenRouter responses
vi.mock('../src/utils/openrouter', () => ({
  OpenRouterClient: class MockOpenRouterClient {
    constructor(public apiKey: string) {}
    
    async chat(params: any) {
      // Return mock responses based on the request
      if (params.messages[0]?.content?.includes('research')) {
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                objectiveId: 'obj-123',
                title: 'Mock Objective',
                description: 'Mock description',
                keyTopics: ['Topic 1', 'Topic 2'],
                practicalApplications: ['Application 1'],
                difficultyGuidelines: {
                  easy: 'Basic concepts',
                  medium: 'Applied knowledge',
                  hard: 'Expert level'
                }
              })
            }
          }]
        }
      }
      
      if (params.messages[0]?.content?.includes('generate')) {
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                question: 'Mock generated question?',
                options: [
                  'A) Option 1',
                  'B) Option 2',
                  'C) Option 3',
                  'D) Option 4'
                ],
                correctAnswer: 'B',
                explanation: 'Mock explanation',
                difficulty: params.messages[0]?.content?.match(/difficulty: (\w+)/)?.[1] || 'medium'
              })
            }
          }]
        }
      }
      
      return {
        choices: [{
          message: { content: 'Mock response' }
        }]
      }
    }
    
    async validateQuestion(question: any) {
      // Simple validation logic for testing
      const issues = []
      
      if (question.question.length < 10) {
        issues.push('Question too short')
      }
      
      if (question.options.length !== 4) {
        issues.push('Must have 4 options')
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        suggestions: issues.map(i => `Fix: ${i}`)
      }
    }
  }
}))

// Mock database queries
vi.mock('../src/utils/db', () => ({
  getDB: () => ({
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([
          { id: 'obj-1', title: 'Objective 1', examId: 'exam-123' },
          { id: 'obj-2', title: 'Objective 2', examId: 'exam-123' }
        ])
      })
    }),
    insert: () => ({
      values: () => Promise.resolve({ id: 'mock-id' })
    })
  }),
  exams: {},
  objectives: {},
  questions: {}
}))

// Mock KV namespace
export const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn()
}

// Mock Durable Object namespace
export const mockDurableObjectNamespace = {
  idFromName: (name: string) => ({ name }),
  get: (id: any) => ({
    fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })))
  })
}

// Mock Queue
export const mockQueue = {
  send: vi.fn(),
  sendBatch: vi.fn()
}