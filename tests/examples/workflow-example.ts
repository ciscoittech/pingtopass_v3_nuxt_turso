/**
 * LangGraph Workflow Example
 * Demonstrates the complete question generation workflow with state management
 */

import { QuestionGenerationWorkflow } from '../../server/utils/langchain/workflows/simple'
import { WorkflowState } from '../../server/utils/langchain/workflows/state'
import type { GenerateQuestionsInput } from '../../server/utils/langchain/types'

// Configure environment
process.env.OPENROUTER_API_KEY = 'your-api-key'
process.env.LANGCHAIN_TRACING_V2 = 'true'
process.env.LANGCHAIN_API_KEY = 'your-langsmith-key'
process.env.LANGCHAIN_PROJECT = 'pingtopass-workflow'

async function workflowExample() {
  console.log('🔄 LangGraph Workflow Example\n')
  
  // 1. Create workflow instance
  const workflow = new QuestionGenerationWorkflow()
  
  // 2. Create state tracker (optional - for monitoring)
  const state = new WorkflowState()
  
  // 3. Define input
  const input: GenerateQuestionsInput = {
    examCode: 'AZ-104',
    examName: 'Microsoft Azure Administrator',
    objective: 'Manage Azure identities and governance',
    count: 2,
    difficulty: 'hard',
    customPrompt: 'Focus on Azure AD conditional access and RBAC scenarios'
  }
  
  console.log('📋 Workflow Configuration:')
  console.log(`   Exam: ${input.examCode} - ${input.examName}`)
  console.log(`   Objective: ${input.objective}`)
  console.log(`   Custom Instructions: ${input.customPrompt}\n`)
  
  try {
    // Track workflow progress
    console.log('🚀 Starting workflow...\n')
    
    // Simulate workflow steps for demonstration
    state.transition('researching')
    console.log('🔍 Step 1: Researching objective context...')
    
    state.transition('generating')
    console.log('🤖 Step 2: Generating questions...')
    
    state.transition('validating')
    console.log('✅ Step 3: Validating questions...')
    
    // 4. Run the actual workflow
    const result = await workflow.run(input)
    
    state.transition('completed')
    console.log('\n✨ Workflow completed successfully!\n')
    
    // 5. Display workflow metadata
    console.log('📊 Workflow Metadata:')
    console.log(`   Steps executed: ${result.metadata.workflowSteps.join(' → ')}`)
    console.log(`   Retries: ${result.metadata.retries || 0}`)
    console.log(`   Total tokens: ${result.metadata.totalTokens}`)
    console.log(`   Total cost: $${result.metadata.cost.toFixed(4)}\n`)
    
    // 6. Display generated questions
    console.log('📝 Generated Questions:')
    result.questions.forEach((q, i) => {
      console.log(`\n${i + 1}. ${q.question}`)
      console.log(`   Difficulty: ${q.difficulty}`)
      console.log(`   Correct Answer: ${q.correctAnswer}`)
    })
    
    // 7. Show workflow history
    console.log('\n📜 Workflow History:')
    state.getHistory().forEach(entry => {
      console.log(`   ${entry.timestamp}: ${entry.step}`)
    })
    
    // 8. LangSmith workflow trace
    if (process.env.LANGCHAIN_TRACING_V2 === 'true') {
      console.log('\n🔍 View complete workflow trace:')
      console.log(`   https://smith.langchain.com/projects/${process.env.LANGCHAIN_PROJECT}`)
    }
    
  } catch (error) {
    state.setError(error.message)
    state.transition('error')
    console.error('❌ Workflow error:', error)
    console.log('\n📜 Error State:', state.getData())
  }
}

// Demonstrate retry logic
async function retryExample() {
  console.log('\n\n🔁 Retry Logic Example\n')
  
  const workflow = new QuestionGenerationWorkflow()
  
  // Mock validation to fail initially
  let attempts = 0
  workflow.validateQuestions = async (questions) => {
    attempts++
    console.log(`   Validation attempt ${attempts}...`)
    
    if (attempts < 2) {
      console.log(`   ❌ Validation failed - will retry`)
      return {
        isValid: false,
        issues: ['Question clarity needs improvement'],
        suggestions: ['Add more context to the question']
      }
    }
    
    console.log(`   ✅ Validation passed`)
    return {
      isValid: true,
      issues: [],
      suggestions: []
    }
  }
  
  // Mock other methods
  workflow.researchObjective = async () => ({ 
    objective: 'Test', 
    context: 'Test context' 
  })
  
  workflow.generateQuestions = async () => ({
    questions: [{
      id: 'q_test',
      question: 'What is the purpose of Azure RBAC?',
      options: [
        'A) To manage virtual networks',
        'B) To control access to Azure resources',
        'C) To monitor resource usage',
        'D) To deploy applications'
      ],
      correctAnswer: 'B',
      explanation: 'Azure RBAC is used to control access to Azure resources.',
      difficulty: 'medium',
      objective: 'Test',
      questionType: 'multiple-choice'
    }]
  })
  
  const result = await workflow.run({
    examCode: 'AZ-104',
    examName: 'Azure Administrator',
    objective: 'Test retry logic',
    count: 1
  })
  
  console.log(`\n   Workflow completed with ${result.metadata.retries} retry(s)`)
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  workflowExample()
    .then(() => retryExample())
    .catch(console.error)
}