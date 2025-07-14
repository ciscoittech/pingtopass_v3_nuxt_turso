import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuestionGenerator } from '../../../server/utils/langchain/agents/generator'
import type { GenerateQuestionsInput, Question } from '../../../server/utils/langchain/types'

describe('Question Generator Agent', () => {
  let generator: QuestionGenerator

  beforeEach(() => {
    vi.clearAllMocks()
    generator = new QuestionGenerator()
  })

  describe('generate()', () => {
    it('should generate a single question for given objective', async () => {
      // Arrange
      const input: GenerateQuestionsInput = {
        examCode: 'AWS-SAA-C03',
        examName: 'AWS Solutions Architect Associate',
        objective: 'Design secure architectures',
        objectiveDescription: 'Understanding AWS security services and features',
        count: 1,
        difficulty: 'medium'
      }

      // Mock the LLM response
      const mockQuestion: Question = {
        id: 'q_test_1',
        question: 'Which AWS service provides DDoS protection at no additional cost?',
        options: [
          'A) AWS WAF',
          'B) AWS Shield Standard',
          'C) AWS Shield Advanced',
          'D) Amazon GuardDuty'
        ],
        correctAnswer: 'B',
        explanation: 'AWS Shield Standard provides automatic DDoS protection at no additional cost for all AWS customers.',
        difficulty: 'medium',
        objective: input.objective,
        questionType: 'multiple-choice'
      }

      vi.spyOn(generator as any, 'parseResponse').mockReturnValue([mockQuestion])

      // Act
      const result = await generator.generate(input)

      // Assert
      expect(result.questions).toHaveLength(1)
      expect(result.questions[0]).toMatchObject({
        question: expect.stringContaining('AWS'),
        options: expect.arrayContaining([
          expect.stringContaining('A)'),
          expect.stringContaining('B)'),
          expect.stringContaining('C)'),
          expect.stringContaining('D)')
        ]),
        correctAnswer: expect.stringMatching(/^[A-D]$/),
        explanation: expect.any(String),
        difficulty: 'medium'
      })
      expect(result.metadata).toMatchObject({
        examCode: 'AWS-SAA-C03',
        objective: input.objective,
        generatedAt: expect.any(String),
        modelUsed: expect.any(String)
      })
    })

    it('should generate multiple questions when count > 1', async () => {
      // Arrange
      const input: GenerateQuestionsInput = {
        examCode: 'AWS-SAA-C03',
        examName: 'AWS Solutions Architect Associate',
        objective: 'Design resilient architectures',
        count: 3,
        difficulty: 'hard'
      }

      // Act
      const result = await generator.generate(input)

      // Assert
      expect(result.questions).toHaveLength(3)
      result.questions.forEach(q => {
        expect(q.difficulty).toBe('hard')
        expect(q.objective).toBe(input.objective)
      })
    })

    it('should handle API errors gracefully', async () => {
      // Arrange
      const input: GenerateQuestionsInput = {
        examCode: 'AWS-SAA-C03',
        examName: 'AWS Solutions Architect Associate',
        objective: 'Test objective',
        count: 1
      }

      // Mock API error
      vi.spyOn(generator as any, 'callLLM').mockRejectedValue(
        new Error('Rate limit exceeded')
      )

      // Act & Assert
      await expect(generator.generate(input)).rejects.toThrow('Failed to generate questions: Rate limit exceeded')
    })

    it('should validate generated questions have required fields', async () => {
      // Arrange
      const input: GenerateQuestionsInput = {
        examCode: 'AWS-SAA-C03',
        examName: 'AWS Solutions Architect Associate',
        objective: 'Test objective',
        count: 1
      }

      // Mock invalid response (missing correctAnswer)
      const invalidQuestion = {
        question: 'Test question?',
        options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
        explanation: 'Test explanation'
      }

      vi.spyOn(generator as any, 'parseResponse').mockReturnValue([invalidQuestion])

      // Act & Assert
      await expect(generator.generate(input)).rejects.toThrow('Invalid question format')
    })

    it('should support custom prompts', async () => {
      // Arrange
      const input: GenerateQuestionsInput = {
        examCode: 'AWS-SAA-C03',
        examName: 'AWS Solutions Architect Associate',
        objective: 'Design secure architectures',
        count: 1,
        customPrompt: 'Focus on IAM best practices and least privilege principle'
      }

      const mockCallLLM = vi.spyOn(generator as any, 'callLLM')

      // Act
      await generator.generate(input)

      // Assert
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('IAM best practices')
      )
    })

    it('should return structured response format', async () => {
      // Arrange
      const input: GenerateQuestionsInput = {
        examCode: 'AZ-104',
        examName: 'Microsoft Azure Administrator',
        objective: 'Manage Azure identities and governance',
        count: 2,
        difficulty: 'easy'
      }

      // Act
      const result = await generator.generate(input)

      // Assert structure
      expect(result).toMatchObject({
        questions: expect.any(Array),
        metadata: {
          examCode: 'AZ-104',
          examName: 'Microsoft Azure Administrator',
          objective: input.objective,
          count: 2,
          difficulty: 'easy',
          generatedAt: expect.any(String),
          modelUsed: expect.any(String),
          totalTokens: expect.any(Number),
          cost: expect.any(Number)
        }
      })
    })

    it('should generate questions with proper formatting', async () => {
      // Arrange
      const input: GenerateQuestionsInput = {
        examCode: 'AWS-SAA-C03',
        examName: 'AWS Solutions Architect Associate',
        objective: 'Design secure architectures',
        count: 1
      }

      // Act
      const result = await generator.generate(input)
      const question = result.questions[0]

      // Assert formatting
      expect(question.options).toHaveLength(4)
      question.options.forEach((option, index) => {
        const letter = String.fromCharCode(65 + index) // A, B, C, D
        expect(option).toMatch(new RegExp(`^${letter}\\)`))
      })
      expect(question.correctAnswer).toMatch(/^[A-D]$/)
      expect(question.explanation.length).toBeGreaterThan(20)
    })
  })

  describe('validateQuestion()', () => {
    it('should validate a well-formed question', () => {
      // Arrange
      const question: Question = {
        id: 'q_test',
        question: 'Which service provides serverless compute?',
        options: [
          'A) EC2',
          'B) Lambda',
          'C) ECS',
          'D) EKS'
        ],
        correctAnswer: 'B',
        explanation: 'AWS Lambda provides serverless compute capabilities.',
        difficulty: 'easy',
        objective: 'Understand compute services',
        questionType: 'multiple-choice'
      }

      // Act & Assert
      expect(() => generator.validateQuestion(question)).not.toThrow()
    })

    it('should reject question with invalid number of options', () => {
      // Arrange
      const question = {
        question: 'Test?',
        options: ['A) Only', 'B) Two'],
        correctAnswer: 'A',
        explanation: 'Test'
      }

      // Act & Assert
      expect(() => generator.validateQuestion(question as any))
        .toThrow('Question must have exactly 4 options')
    })

    it('should reject question with invalid correct answer', () => {
      // Arrange
      const question = {
        question: 'Test?',
        options: ['A) 1', 'B) 2', 'C) 3', 'D) 4'],
        correctAnswer: 'E', // Invalid
        explanation: 'Test'
      }

      // Act & Assert
      expect(() => generator.validateQuestion(question as any))
        .toThrow('Correct answer must be A, B, C, or D')
    })
  })
})