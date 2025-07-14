import { describe, it, expect, vi } from 'vitest'

// Set up environment
process.env.OPENROUTER_API_KEY = 'test-key'

describe('Simple Question Generation Workflow', () => {
  it('should create and execute a basic workflow', async () => {
    const { QuestionGenerationWorkflow } = await import('../../../server/utils/langchain/workflows/simple')
    
    const workflow = new QuestionGenerationWorkflow()
    
    // Verify workflow structure
    expect(workflow).toBeDefined()
    expect(workflow.run).toBeDefined()
    expect(workflow.researchObjective).toBeDefined()
    expect(workflow.generateQuestions).toBeDefined()
    expect(workflow.validateQuestions).toBeDefined()
  })

  it('should handle workflow state transitions', async () => {
    const { QuestionGenerationWorkflow } = await import('../../../server/utils/langchain/workflows/simple')
    
    const workflow = new QuestionGenerationWorkflow()
    
    // Mock the individual steps to return immediately
    workflow.researchObjective = vi.fn().mockResolvedValue({
      objective: 'Test objective',
      context: 'Test context'
    })
    
    workflow.generateQuestions = vi.fn().mockResolvedValue({
      questions: [{
        id: 'q_test',
        question: 'Test question?',
        options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
        correctAnswer: 'A',
        explanation: 'Test explanation',
        difficulty: 'medium',
        objective: 'Test objective',
        questionType: 'multiple-choice'
      }]
    })
    
    workflow.validateQuestions = vi.fn().mockResolvedValue({
      isValid: true,
      issues: [],
      suggestions: []
    })
    
    // Run workflow
    const result = await workflow.run({
      examCode: 'TEST-001',
      examName: 'Test Exam',
      objective: 'Test objective',
      count: 1
    })
    
    // Verify all steps were called
    expect(workflow.researchObjective).toHaveBeenCalled()
    expect(workflow.generateQuestions).toHaveBeenCalled()
    expect(workflow.validateQuestions).toHaveBeenCalled()
    
    // Verify result structure
    expect(result).toHaveProperty('questions')
    expect(result).toHaveProperty('metadata')
    expect(result.questions).toHaveLength(1)
    expect(result.metadata.workflowSteps).toContain('research')
    expect(result.metadata.workflowSteps).toContain('generate')
    expect(result.metadata.workflowSteps).toContain('validate')
  })

  it('should handle validation failure and retry', async () => {
    const { QuestionGenerationWorkflow } = await import('../../../server/utils/langchain/workflows/simple')
    
    const workflow = new QuestionGenerationWorkflow()
    
    // Mock research
    workflow.researchObjective = vi.fn().mockResolvedValue({
      objective: 'Test', 
      context: 'Context'
    })
    
    // Mock generate
    workflow.generateQuestions = vi.fn().mockResolvedValue({
      questions: [{
        id: 'q_test',
        question: 'Test?',
        options: ['A) 1', 'B) 2', 'C) 3', 'D) 4'],
        correctAnswer: 'A',
        explanation: 'Test',
        difficulty: 'medium',
        objective: 'Test',
        questionType: 'multiple-choice'
      }]
    })
    
    // Mock validation to fail once, then succeed
    let validationCalls = 0
    workflow.validateQuestions = vi.fn().mockImplementation(async () => {
      validationCalls++
      if (validationCalls === 1) {
        return {
          isValid: false,
          issues: ['Question too short'],
          suggestions: ['Add more detail']
        }
      }
      return {
        isValid: true,
        issues: [],
        suggestions: []
      }
    })
    
    const result = await workflow.run({
      examCode: 'TEST-001',
      examName: 'Test Exam',
      objective: 'Test',
      count: 1
    })
    
    // Verify retry happened
    expect(workflow.generateQuestions).toHaveBeenCalledTimes(2) // Initial + retry
    expect(workflow.validateQuestions).toHaveBeenCalledTimes(2)
    expect(result.metadata.retries).toBe(1)
  })

  it('should integrate with LangChain components', async () => {
    // This test verifies the integration points
    const { QuestionGenerationWorkflow } = await import('../../../server/utils/langchain/workflows/simple')
    const { LangChainClient } = await import('../../../server/utils/langchain/client')
    const { QuestionGenerator } = await import('../../../server/utils/langchain/agents/generator')
    
    const workflow = new QuestionGenerationWorkflow()
    
    // Verify it uses the correct components
    expect(workflow).toBeDefined()
    
    // Verify client and generator can be instantiated
    const client = new LangChainClient()
    const generator = new QuestionGenerator()
    
    expect(client.isInitialized()).toBe(true)
    expect(generator).toBeDefined()
  })
})