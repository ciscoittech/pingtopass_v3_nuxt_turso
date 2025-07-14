import { describe, it, expect, beforeEach, vi } from 'vitest'

// Set up environment
process.env.OPENROUTER_API_KEY = 'test-key'

describe('Question Generation Workflow', () => {
  describe('Simple Linear Workflow', () => {
    it('should execute research → generate → validate workflow', async () => {
      // Dynamic import after env setup
      const { QuestionGenerationWorkflow } = await import('../../../server/utils/langchain/workflows/simple')
      
      const workflow = new QuestionGenerationWorkflow()
      
      // Mock the workflow steps
      const mockSteps = {
        research: vi.fn().mockResolvedValue({
          objective: 'Design secure architectures',
          context: 'AWS security best practices, IAM, VPC, encryption'
        }),
        generate: vi.fn().mockResolvedValue({
          questions: [
            {
              question: 'Which AWS service provides DDoS protection?',
              options: ['A) WAF', 'B) Shield', 'C) GuardDuty', 'D) Macie'],
              correctAnswer: 'B',
              explanation: 'AWS Shield provides DDoS protection'
            }
          ]
        }),
        validate: vi.fn().mockResolvedValue({
          isValid: true,
          issues: [],
          suggestions: []
        })
      }

      // Override workflow methods
      workflow.researchObjective = mockSteps.research
      workflow.generateQuestions = mockSteps.generate
      workflow.validateQuestions = mockSteps.validate

      // Execute workflow
      const input = {
        examCode: 'AWS-SAA-C03',
        examName: 'AWS Solutions Architect',
        objective: 'Design secure architectures',
        count: 1
      }

      const result = await workflow.run(input)

      // Verify workflow executed (order verification would require more complex mocking)
      expect(mockSteps.research).toHaveBeenCalled()
      expect(mockSteps.generate).toHaveBeenCalled()
      expect(mockSteps.validate).toHaveBeenCalled()
      
      // Verify result
      expect(result).toMatchObject({
        questions: expect.any(Array),
        metadata: expect.any(Object),
        workflowSteps: ['research', 'generate', 'validate']
      })
    })

    it('should handle validation failures with retry', async () => {
      const { QuestionGenerationWorkflow } = await import('../../../server/utils/langchain/workflows/simple')
      
      const workflow = new QuestionGenerationWorkflow()
      
      // Mock validation to fail first time, succeed second time
      let validationAttempt = 0
      workflow.validateQuestions = vi.fn().mockImplementation(async () => {
        validationAttempt++
        if (validationAttempt === 1) {
          return {
            isValid: false,
            issues: ['Question too vague'],
            suggestions: ['Add more specific context']
          }
        }
        return {
          isValid: true,
          issues: [],
          suggestions: []
        }
      })

      workflow.researchObjective = vi.fn().mockResolvedValue({ context: 'test' })
      workflow.generateQuestions = vi.fn().mockResolvedValue({ questions: [{}] })

      const result = await workflow.run({
        examCode: 'TEST',
        examName: 'Test Exam',
        objective: 'Test',
        count: 1
      })

      // Verify retry happened
      expect(workflow.validateQuestions).toHaveBeenCalledTimes(2)
      expect(result.metadata.retries).toBe(1)
    })

    it('should complete workflow and produce valid questions', async () => {
      const { QuestionGenerationWorkflow } = await import('../../../server/utils/langchain/workflows/simple')
      
      const workflow = new QuestionGenerationWorkflow()
      
      // Test with minimal mocking - just the external calls
      const mockQuestion = {
        id: 'q_test_123',
        question: 'What is the primary benefit of AWS Shield Standard?',
        options: [
          'A) Advanced threat detection',
          'B) Automatic DDoS protection at no cost',
          'C) Real-time traffic analysis',
          'D) Custom security rules'
        ],
        correctAnswer: 'B',
        explanation: 'AWS Shield Standard provides automatic DDoS protection for all AWS customers at no additional cost.',
        difficulty: 'medium',
        objective: 'Security',
        questionType: 'multiple-choice'
      }

      // Mock the LLM calls
      vi.spyOn(workflow as any, 'callLLM').mockResolvedValue({
        content: JSON.stringify({ questions: [mockQuestion] }),
        usage: { totalTokens: 100 }
      })

      const input = {
        examCode: 'AWS-SAA-C03',
        examName: 'AWS Solutions Architect',
        objective: 'Design secure architectures',
        count: 1,
        difficulty: 'medium' as const
      }

      const result = await workflow.run(input)

      expect(result).toMatchObject({
        questions: expect.arrayContaining([
          expect.objectContaining({
            question: expect.any(String),
            correctAnswer: expect.stringMatching(/^[A-D]$/),
            options: expect.arrayContaining([
              expect.stringContaining('A)'),
              expect.stringContaining('B)'),
              expect.stringContaining('C)'),
              expect.stringContaining('D)')
            ])
          })
        ]),
        metadata: {
          examCode: 'AWS-SAA-C03',
          workflowSteps: expect.arrayContaining(['research', 'generate', 'validate']),
          totalTokens: expect.any(Number)
        }
      })
    })
  })

  describe('Workflow State Management', () => {
    it('should track state through workflow execution', async () => {
      const { WorkflowState } = await import('../../../server/utils/langchain/workflows/state')
      
      const state = new WorkflowState()
      
      // Initial state
      expect(state.getStep()).toBe('initialized')
      expect(state.getHistory()).toHaveLength(1)
      
      // Progress through workflow
      state.transition('researching')
      state.addData('research', { context: 'AWS security' })
      
      state.transition('generating')
      state.addData('questions', [{ question: 'Test?' }])
      
      state.transition('validating')
      state.addData('validation', { isValid: true })
      
      state.transition('completed')
      
      // Verify state history
      const history = state.getHistory()
      expect(history).toHaveLength(5)
      expect(history.map(h => h.step)).toEqual([
        'initialized',
        'researching',
        'generating',
        'validating',
        'completed'
      ])
      
      // Verify accumulated data
      const data = state.getData()
      expect(data).toHaveProperty('research')
      expect(data).toHaveProperty('questions')
      expect(data).toHaveProperty('validation')
    })

    it('should handle workflow errors gracefully', async () => {
      const { WorkflowState } = await import('../../../server/utils/langchain/workflows/state')
      
      const state = new WorkflowState()
      
      state.transition('generating')
      state.setError('Generation failed: API rate limit')
      state.transition('error')
      
      expect(state.getStep()).toBe('error')
      expect(state.getError()).toBe('Generation failed: API rate limit')
      expect(state.getData()).toHaveProperty('errorDetails')
    })
  })
})