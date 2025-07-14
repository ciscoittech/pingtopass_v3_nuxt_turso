/**
 * Basic Question Generation Example
 * This demonstrates the simplest way to generate questions using LangChain
 */

import { QuestionGenerator } from '../../server/utils/langchain/agents/generator'
import type { GenerateQuestionsInput } from '../../server/utils/langchain/types'

// Set up environment variables
process.env.OPENROUTER_API_KEY = 'your-api-key'
process.env.LANGCHAIN_TRACING_V2 = 'true' // Enable LangSmith tracing
process.env.LANGCHAIN_API_KEY = 'your-langsmith-key'
process.env.LANGCHAIN_PROJECT = 'pingtopass-examples'

async function basicExample() {
  console.log('🚀 Basic Question Generation Example\n')
  
  // 1. Create the generator
  const generator = new QuestionGenerator()
  
  // 2. Define input
  const input: GenerateQuestionsInput = {
    examCode: 'AWS-SAA-C03',
    examName: 'AWS Solutions Architect Associate',
    objective: 'Design secure architectures',
    objectiveDescription: 'Understanding AWS security services, features, and best practices',
    count: 3,
    difficulty: 'medium'
  }
  
  console.log('📋 Generating questions for:', input.objective)
  console.log(`   Exam: ${input.examCode}`)
  console.log(`   Count: ${input.count}`)
  console.log(`   Difficulty: ${input.difficulty}\n`)
  
  try {
    // 3. Generate questions
    const result = await generator.generate(input)
    
    console.log('✅ Generation complete!\n')
    console.log(`📊 Metadata:`)
    console.log(`   Model: ${result.metadata.modelUsed}`)
    console.log(`   Tokens: ${result.metadata.totalTokens}`)
    console.log(`   Cost: $${result.metadata.cost.toFixed(4)}`)
    console.log(`   Generated at: ${result.metadata.generatedAt}\n`)
    
    // 4. Display questions
    console.log('📝 Generated Questions:\n')
    result.questions.forEach((question, index) => {
      console.log(`Question ${index + 1}:`)
      console.log(`   ${question.question}`)
      console.log(`   Options:`)
      question.options.forEach(option => {
        const isCorrect = option.startsWith(question.correctAnswer)
        console.log(`     ${option} ${isCorrect ? '✓' : ''}`)
      })
      console.log(`   Explanation: ${question.explanation.substring(0, 100)}...`)
      console.log('')
    })
    
    // 5. LangSmith trace URL (if enabled)
    if (process.env.LANGCHAIN_TRACING_V2 === 'true') {
      console.log('🔍 View trace in LangSmith:')
      console.log(`   https://smith.langchain.com/projects/${process.env.LANGCHAIN_PROJECT}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  basicExample()
}