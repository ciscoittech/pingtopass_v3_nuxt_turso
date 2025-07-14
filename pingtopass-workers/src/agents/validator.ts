import { OpenRouterClient } from '../utils/openrouter'
import { GeneratedQuestion } from './generator'
import { ResearchResult } from './researcher'

export interface ValidationResult {
  questionId: string
  isValid: boolean
  issues: string[]
  suggestions: string[]
  fixedQuestion?: GeneratedQuestion
  validationScore: number // 0-100
}

export class ValidatorAgent {
  private openRouter: OpenRouterClient
  
  constructor(apiKey: string) {
    this.openRouter = new OpenRouterClient(apiKey)
  }

  async validate(
    question: GeneratedQuestion, 
    research: ResearchResult
  ): Promise<ValidationResult> {
    // First, run automated checks
    const automatedIssues = this.runAutomatedChecks(question)
    
    // If automated checks fail critically, return early
    if (automatedIssues.critical.length > 0) {
      return {
        questionId: question.id,
        isValid: false,
        issues: automatedIssues.critical,
        suggestions: ['Fix critical formatting issues before AI validation'],
        validationScore: 0
      }
    }

    // Run AI validation
    const aiValidation = await this.openRouter.validateQuestion(question)
    
    // Combine automated and AI validation
    const allIssues = [...automatedIssues.warnings, ...aiValidation.issues]
    const isValid = aiValidation.isValid && allIssues.length === 0
    
    // Calculate validation score
    const score = this.calculateValidationScore(
      automatedIssues,
      aiValidation,
      research
    )

    // Attempt to fix the question if invalid but fixable
    let fixedQuestion: GeneratedQuestion | undefined
    if (!isValid && score > 50) {
      fixedQuestion = await this.attemptFix(question, allIssues, aiValidation.suggestions)
    }

    return {
      questionId: question.id,
      isValid,
      issues: allIssues,
      suggestions: aiValidation.suggestions,
      fixedQuestion,
      validationScore: score
    }
  }

  async validateBatch(
    questions: GeneratedQuestion[], 
    research: ResearchResult
  ): Promise<ValidationResult[]> {
    // Process in parallel with concurrency limit
    const concurrencyLimit = 5
    const results: ValidationResult[] = []
    
    for (let i = 0; i < questions.length; i += concurrencyLimit) {
      const batch = questions.slice(i, i + concurrencyLimit)
      const batchResults = await Promise.all(
        batch.map(q => this.validate(q, research))
      )
      results.push(...batchResults)
    }
    
    return results
  }

  private runAutomatedChecks(question: GeneratedQuestion): {
    critical: string[]
    warnings: string[]
  } {
    const critical: string[] = []
    const warnings: string[] = []

    // Check question text
    if (!question.question || question.question.trim().length < 10) {
      critical.push('Question text is too short or missing')
    }
    if (question.question.length > 500) {
      warnings.push('Question text may be too long')
    }

    // Check options
    if (!question.options || question.options.length !== 4) {
      critical.push('Question must have exactly 4 options')
    } else {
      // Check each option
      question.options.forEach((opt, idx) => {
        if (!opt || opt.trim().length < 2) {
          critical.push(`Option ${String.fromCharCode(65 + idx)} is too short or missing`)
        }
        if (!opt.match(/^[A-D]\)/)) {
          warnings.push(`Option ${idx + 1} should start with ${String.fromCharCode(65 + idx)})`)
        }
      })

      // Check for duplicate options
      const uniqueOptions = new Set(question.options.map(o => o.toLowerCase().trim()))
      if (uniqueOptions.size < 4) {
        critical.push('Duplicate options detected')
      }
    }

    // Check correct answer
    if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
      critical.push('Correct answer must be A, B, C, or D')
    }

    // Check explanation
    if (!question.explanation || question.explanation.trim().length < 20) {
      critical.push('Explanation is too short or missing')
    }

    // Check difficulty
    if (!['easy', 'medium', 'hard'].includes(question.difficulty)) {
      warnings.push('Invalid difficulty level')
    }

    return { critical, warnings }
  }

  private calculateValidationScore(
    automatedIssues: { critical: string[], warnings: string[] },
    aiValidation: { isValid: boolean, issues: string[] },
    research: ResearchResult
  ): number {
    let score = 100

    // Deduct for automated issues
    score -= automatedIssues.critical.length * 20
    score -= automatedIssues.warnings.length * 5

    // Deduct for AI validation issues
    score -= aiValidation.issues.length * 10
    if (!aiValidation.isValid) score -= 20

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score))
  }

  private async attemptFix(
    question: GeneratedQuestion,
    issues: string[],
    suggestions: string[]
  ): Promise<GeneratedQuestion | undefined> {
    const fixPrompt = `Fix this exam question based on the issues and suggestions:

ORIGINAL QUESTION:
${JSON.stringify(question, null, 2)}

ISSUES FOUND:
${issues.map(i => `- ${i}`).join('\n')}

SUGGESTIONS:
${suggestions.map(s => `- ${s}`).join('\n')}

Return the fixed question in the same JSON format.`

    try {
      const response = await this.openRouter.chat({
        model: 'anthropic/claude-3.5-haiku',
        messages: [
          { role: 'system', content: 'Fix the exam question maintaining the same format.' },
          { role: 'user', content: fixPrompt }
        ],
        temperature: 0.3
      })

      const content = response.choices[0]?.message?.content
      if (!content) return undefined

      const fixed = JSON.parse(content)
      return {
        ...question,
        ...fixed,
        metadata: {
          ...question.metadata,
          wasFixed: true,
          fixedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Failed to fix question:', error)
      return undefined
    }
  }
}