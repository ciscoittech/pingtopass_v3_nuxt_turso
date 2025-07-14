import { describe, it, expect, beforeAll } from 'vitest'
import { QuestionGenerator } from '../../../server/utils/langchain/agents/generator'
import type { GenerateQuestionsInput } from '../../../server/utils/langchain/types'

// Mock environment
process.env.OPENROUTER_API_KEY = 'test-key'
process.env.LANGCHAIN_TRACING_V2 = 'true'
process.env.LANGCHAIN_API_KEY = 'test-langsmith-key'
process.env.LANGCHAIN_PROJECT = 'pingtopass-test'

describe('Question Generation Integration Test', () => {
  let generator: QuestionGenerator

  beforeAll(() => {
    generator = new QuestionGenerator()
  })

  // This is a mock test - in real integration tests, you would use actual API
  it.skip('should generate questions using LangChain (mocked)', async () => {
    const input: GenerateQuestionsInput = {
      examCode: 'AWS-SAA-C03',
      examName: 'AWS Solutions Architect Associate',
      objective: 'Design secure architectures',
      objectiveDescription: 'Understanding AWS security services and features',
      count: 2,
      difficulty: 'medium'
    }

    const result = await generator.generate(input)

    // Verify the response structure
    expect(result).toMatchObject({
      questions: expect.any(Array),
      metadata: {
        examCode: 'AWS-SAA-C03',
        examName: 'AWS Solutions Architect Associate',
        objective: 'Design secure architectures',
        count: 2,
        difficulty: 'medium',
        generatedAt: expect.any(String),
        modelUsed: expect.any(String),
        totalTokens: expect.any(Number),
        cost: expect.any(Number)
      }
    })

    // Verify questions
    expect(result.questions).toHaveLength(2)
    result.questions.forEach(question => {
      expect(question).toMatchObject({
        id: expect.stringMatching(/^q_/),
        question: expect.any(String),
        options: expect.arrayContaining([
          expect.stringContaining('A)'),
          expect.stringContaining('B)'),
          expect.stringContaining('C)'),
          expect.stringContaining('D)')
        ]),
        correctAnswer: expect.stringMatching(/^[A-D]$/),
        explanation: expect.any(String),
        difficulty: 'medium',
        objective: 'Design secure architectures',
        questionType: 'multiple-choice'
      })
    })
  }, 30000) // 30 second timeout for API calls

  // Demonstration test with mocked response
  it('should demonstrate question generation flow', () => {
    const mockQuestions = [
      {
        question: 'Which AWS service provides DDoS protection at no additional cost?',
        options: [
          'A) AWS WAF',
          'B) AWS Shield Standard',
          'C) AWS Shield Advanced',
          'D) Amazon GuardDuty'
        ],
        correctAnswer: 'B',
        explanation: 'AWS Shield Standard provides automatic DDoS protection for all AWS customers at no additional cost.',
        difficulty: 'medium'
      },
      {
        question: 'What is the MOST secure way to store database credentials for an EC2 application?',
        options: [
          'A) Hard-code them in the application',
          'B) Store them in environment variables',
          'C) Use AWS Systems Manager Parameter Store',
          'D) Save them in a configuration file'
        ],
        correctAnswer: 'C',
        explanation: 'AWS Systems Manager Parameter Store provides secure, hierarchical storage for configuration data and secrets.',
        difficulty: 'medium'
      }
    ]

    // Validate question structure
    mockQuestions.forEach(question => {
      expect(() => generator.validateQuestion(question)).not.toThrow()
    })

    expect(mockQuestions).toHaveLength(2)
    expect(mockQuestions[0].correctAnswer).toBe('B')
    expect(mockQuestions[1].correctAnswer).toBe('C')
  })
})