import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResearcherAgent } from '../../src/agents/researcher'
import { GeneratorAgent } from '../../src/agents/generator'
import { ValidatorAgent } from '../../src/agents/validator'
import type { Env } from '../../src/index'

// Mock environment
const mockEnv: Partial<Env> = {
  RESEARCH_CACHE: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  } as any,
  OPENROUTER_API_KEY: 'test-api-key'
}

describe('ResearcherAgent', () => {
  let researcher: ResearcherAgent
  
  beforeEach(() => {
    researcher = new ResearcherAgent('test-api-key')
    vi.clearAllMocks()
  })

  it('should use cache when available', async () => {
    const cachedResearch = {
      objectiveId: 'obj-123',
      title: 'Cached Objective',
      description: 'Cached description',
      keyTopics: ['Topic 1', 'Topic 2'],
      practicalApplications: ['App 1'],
      difficultyGuidelines: {
        easy: 'Basic concepts',
        medium: 'Applied knowledge',
        hard: 'Expert level'
      }
    }

    mockEnv.RESEARCH_CACHE!.get = vi.fn().mockResolvedValue(JSON.stringify(cachedResearch))

    const result = await researcher.research('obj-123', mockEnv as Env)

    expect(mockEnv.RESEARCH_CACHE!.get).toHaveBeenCalledWith('research:obj-123')
    expect(result).toEqual(cachedResearch)
  })

  it('should generate new research when cache misses', async () => {
    mockEnv.RESEARCH_CACHE!.get = vi.fn().mockResolvedValue(null)

    // Mock OpenRouter response
    vi.spyOn(researcher as any, 'generateResearch').mockResolvedValue({
      objectiveId: 'obj-123',
      title: 'New Research',
      description: 'Fresh research',
      keyTopics: ['New Topic'],
      practicalApplications: ['New App'],
      difficultyGuidelines: {
        easy: 'Simple',
        medium: 'Moderate',
        hard: 'Complex'
      }
    })

    const result = await researcher.research('obj-123', mockEnv as Env)

    expect(mockEnv.RESEARCH_CACHE!.put).toHaveBeenCalled()
    expect(result.title).toBe('New Research')
  })

  it('should handle research errors gracefully', async () => {
    mockEnv.RESEARCH_CACHE!.get = vi.fn().mockRejectedValue(new Error('Cache error'))

    await expect(researcher.research('obj-123', mockEnv as Env)).rejects.toThrow()
  })
})

describe('GeneratorAgent', () => {
  let generator: GeneratorAgent
  const mockResearch = {
    objectiveId: 'obj-123',
    title: 'Test Objective',
    description: 'Test description',
    keyTopics: ['Topic 1', 'Topic 2'],
    practicalApplications: ['App 1'],
    difficultyGuidelines: {
      easy: 'Basic',
      medium: 'Intermediate',
      hard: 'Advanced'
    }
  }

  beforeEach(() => {
    generator = new GeneratorAgent('test-api-key', 'anthropic/claude-3.5-haiku')
  })

  it('should generate a single question', async () => {
    // Mock OpenRouter response
    vi.spyOn(generator['openRouter'], 'chat').mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            question: 'What is the purpose of Test Objective?',
            options: [
              'A) Option 1',
              'B) Option 2',
              'C) Option 3',
              'D) Option 4'
            ],
            correctAnswer: 'B',
            explanation: 'Option B is correct because...',
            difficulty: 'easy'
          })
        }
      }]
    } as any)

    const result = await generator.generateSingle(mockResearch, 'easy')

    expect(result).toHaveProperty('id')
    expect(result.question).toBe('What is the purpose of Test Objective?')
    expect(result.options).toHaveLength(4)
    expect(result.correctAnswer).toBe('B')
    expect(result.difficulty).toBe('easy')
    expect(result.metadata.objectiveId).toBe('obj-123')
  })

  it('should generate batch questions', async () => {
    vi.spyOn(generator, 'generateSingle').mockImplementation(async (research, difficulty) => ({
      id: `q_${Date.now()}`,
      question: `Test question for ${difficulty}`,
      options: ['A) A', 'B) B', 'C) C', 'D) D'],
      correctAnswer: 'A',
      explanation: 'Test explanation',
      difficulty,
      metadata: {
        objectiveId: research.objectiveId,
        objectiveTitle: research.title,
        generatedAt: new Date().toISOString(),
        modelUsed: 'test-model'
      }
    }))

    const result = await generator.generateBatch(mockResearch, 3, 'mixed')

    expect(result).toHaveLength(3)
    expect(result.filter(q => q.difficulty === 'easy')).toHaveLength(1)
    expect(result.filter(q => q.difficulty === 'medium')).toHaveLength(1)
    expect(result.filter(q => q.difficulty === 'hard')).toHaveLength(1)
  })

  it('should handle generation errors with retry', async () => {
    let attempts = 0
    vi.spyOn(generator['openRouter'], 'chat').mockImplementation(async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('Temporary failure')
      }
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              question: 'Success after retry',
              options: ['A) A', 'B) B', 'C) C', 'D) D'],
              correctAnswer: 'A',
              explanation: 'Retry successful',
              difficulty: 'easy'
            })
          }
        }]
      } as any
    })

    const result = await generator.generateSingle(mockResearch, 'easy')
    
    expect(attempts).toBe(3)
    expect(result.question).toBe('Success after retry')
  })
})

describe('ValidatorAgent', () => {
  let validator: ValidatorAgent
  const mockResearch = {
    objectiveId: 'obj-123',
    title: 'Test Objective',
    description: 'Test description',
    keyTopics: ['Topic 1'],
    practicalApplications: ['App 1'],
    difficultyGuidelines: {
      easy: 'Basic',
      medium: 'Intermediate',
      hard: 'Advanced'
    }
  }

  beforeEach(() => {
    validator = new ValidatorAgent('test-api-key')
  })

  it('should validate a well-formed question', async () => {
    const question = {
      id: 'q_123',
      question: 'What is the primary purpose of this feature?',
      options: [
        'A) To improve performance',
        'B) To enhance security',
        'C) To reduce complexity',
        'D) To increase scalability'
      ],
      correctAnswer: 'B',
      explanation: 'Security is the primary concern when implementing this feature because it handles sensitive data.',
      difficulty: 'medium' as const,
      metadata: {
        objectiveId: 'obj-123',
        objectiveTitle: 'Test Objective',
        generatedAt: new Date().toISOString(),
        modelUsed: 'test-model'
      }
    }

    // Mock AI validation response
    vi.spyOn(validator['openRouter'], 'validateQuestion').mockResolvedValue({
      isValid: true,
      issues: [],
      suggestions: []
    })

    const result = await validator.validate(question, mockResearch)

    expect(result.isValid).toBe(true)
    expect(result.issues).toHaveLength(0)
    expect(result.validationScore).toBeGreaterThan(80)
  })

  it('should detect critical formatting issues', async () => {
    const badQuestion = {
      id: 'q_bad',
      question: 'Too short?',
      options: [
        'A) Yes',
        'B) No',
        'C) Maybe',
        'C) Maybe' // Duplicate
      ],
      correctAnswer: 'E', // Invalid
      explanation: 'Short',
      difficulty: 'invalid' as any,
      metadata: {}
    }

    const result = await validator.validate(badQuestion, mockResearch)

    expect(result.isValid).toBe(false)
    expect(result.issues).toContain('Question text is too short or missing')
    expect(result.issues).toContain('Duplicate options detected')
    expect(result.issues).toContain('Correct answer must be A, B, C, or D')
    expect(result.validationScore).toBe(0)
  })

  it('should attempt to fix questions with minor issues', async () => {
    const fixableQuestion = {
      id: 'q_fix',
      question: 'What is the correct answer to this question about testing?',
      options: [
        'Option A without prefix',
        'B) Option B',
        'C) Option C',
        'D) Option D'
      ],
      correctAnswer: 'B',
      explanation: 'This explanation is adequate for the question.',
      difficulty: 'medium' as const,
      metadata: {}
    }

    // Mock AI validation with suggestions
    vi.spyOn(validator['openRouter'], 'validateQuestion').mockResolvedValue({
      isValid: false,
      issues: ['Option formatting inconsistent'],
      suggestions: ['Ensure all options start with letter and parenthesis']
    })

    // Mock fix attempt
    vi.spyOn(validator['openRouter'], 'chat').mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            ...fixableQuestion,
            options: [
              'A) Option A without prefix',
              'B) Option B',
              'C) Option C',
              'D) Option D'
            ]
          })
        }
      }]
    } as any)

    const result = await validator.validate(fixableQuestion, mockResearch)

    expect(result.isValid).toBe(false)
    expect(result.fixedQuestion).toBeDefined()
    expect(result.fixedQuestion?.options[0]).toMatch(/^A\)/)
    expect(result.validationScore).toBeGreaterThan(50)
  })

  it('should validate batch of questions efficiently', async () => {
    const questions = Array.from({ length: 10 }, (_, i) => ({
      id: `q_${i}`,
      question: `Test question ${i}?`,
      options: ['A) A', 'B) B', 'C) C', 'D) D'],
      correctAnswer: 'A',
      explanation: 'Test explanation',
      difficulty: 'easy' as const,
      metadata: {}
    }))

    vi.spyOn(validator['openRouter'], 'validateQuestion').mockResolvedValue({
      isValid: true,
      issues: [],
      suggestions: []
    })

    const results = await validator.validateBatch(questions, mockResearch)

    expect(results).toHaveLength(10)
    expect(results.every(r => r.isValid)).toBe(true)
  })
})

describe('Integration: Question Generation Pipeline', () => {
  it('should complete full pipeline from research to validation', async () => {
    const researcher = new ResearcherAgent('test-key')
    const generator = new GeneratorAgent('test-key', 'test-model')
    const validator = new ValidatorAgent('test-key')

    // Mock research
    vi.spyOn(researcher, 'research').mockResolvedValue({
      objectiveId: 'obj-123',
      title: 'Integration Test Objective',
      description: 'Testing the full pipeline',
      keyTopics: ['Testing', 'Integration'],
      practicalApplications: ['E2E Testing'],
      difficultyGuidelines: {
        easy: 'Basic testing',
        medium: 'Integration testing',
        hard: 'Complex scenarios'
      }
    })

    // Mock generation
    vi.spyOn(generator, 'generateSingle').mockResolvedValue({
      id: 'q_integration',
      question: 'What is the purpose of integration testing?',
      options: [
        'A) To test individual units',
        'B) To test component interactions',
        'C) To test UI only',
        'D) To test performance'
      ],
      correctAnswer: 'B',
      explanation: 'Integration testing verifies that different components work together correctly.',
      difficulty: 'medium',
      metadata: {
        objectiveId: 'obj-123',
        objectiveTitle: 'Integration Test Objective',
        generatedAt: new Date().toISOString(),
        modelUsed: 'test-model'
      }
    })

    // Mock validation
    vi.spyOn(validator, 'validate').mockResolvedValue({
      questionId: 'q_integration',
      isValid: true,
      issues: [],
      suggestions: [],
      validationScore: 95
    })

    // Execute pipeline
    const research = await researcher.research('obj-123', mockEnv as Env)
    const question = await generator.generateSingle(research, 'medium')
    const validation = await validator.validate(question, research)

    expect(research.title).toBe('Integration Test Objective')
    expect(question.correctAnswer).toBe('B')
    expect(validation.isValid).toBe(true)
    expect(validation.validationScore).toBe(95)
  })
})