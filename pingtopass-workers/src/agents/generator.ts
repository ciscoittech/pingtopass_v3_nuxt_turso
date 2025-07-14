import { OpenRouterClient } from '../utils/openrouter'
import { ResearchResult } from './researcher'
import { nanoid } from 'nanoid'

export interface GeneratedQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  objective: string
  metadata: {
    generatedAt: string
    model: string
    researchBased: boolean
  }
}

export class GeneratorAgent {
  private openRouter: OpenRouterClient
  private model: string
  
  constructor(apiKey: string, model: string = 'anthropic/claude-3.5-haiku') {
    this.openRouter = new OpenRouterClient(apiKey)
    this.model = model
  }

  async generateBatch(
    research: ResearchResult, 
    count: number, 
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  ): Promise<GeneratedQuestion[]> {
    const prompt = this.buildPrompt(research, count, difficulty)
    
    try {
      const response = await this.openRouter.generateQuestions(prompt, this.model)
      
      // Add metadata and IDs to questions
      const questions = response.questions.map((q: any) => ({
        id: `q_${nanoid()}`,
        ...q,
        objective: research.objectiveTitle,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: this.model,
          researchBased: true
        }
      }))
      
      return questions
    } catch (error) {
      console.error('Question generation failed:', error)
      throw new Error(`Failed to generate questions: ${error}`)
    }
  }

  async generateSingle(research: ResearchResult, difficulty: 'easy' | 'medium' | 'hard'): Promise<GeneratedQuestion> {
    const questions = await this.generateBatch(research, 1, difficulty)
    return questions[0]
  }

  private buildPrompt(
    research: ResearchResult, 
    count: number, 
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  ): string {
    const difficultyGuide = difficulty === 'mixed' 
      ? 'Mix of easy, medium, and hard questions'
      : research.difficultyGuidelines[difficulty]

    return `Generate ${count} high-quality certification exam questions based on this research:

EXAM CONTEXT: ${research.examContext}
OBJECTIVE: ${research.objectiveTitle}
${research.objectiveDescription ? `DESCRIPTION: ${research.objectiveDescription}` : ''}

KEY TOPICS TO COVER:
${research.keyTopics.map(t => `- ${t}`).join('\n')}

PRACTICAL APPLICATIONS:
${research.practicalApplications.map(a => `- ${a}`).join('\n')}

COMMON MISCONCEPTIONS TO TEST:
${research.commonMisconceptions.map(m => `- ${m}`).join('\n')}

DIFFICULTY LEVEL: ${difficulty}
DIFFICULTY GUIDELINE: ${difficultyGuide}

REQUIREMENTS:
1. Questions must test practical, real-world knowledge
2. Include scenario-based questions when appropriate
3. Each question must have exactly 4 options (A, B, C, D)
4. Only one correct answer per question
5. Explanations should teach the concept, not just state the answer
6. Vary question types (direct, scenario, troubleshooting, best practice)
7. Ensure questions align with the ${difficulty} difficulty level

Generate exactly ${count} questions following the specified format.`
  }

  // Generate questions with retries for resilience
  async generateWithRetry(
    research: ResearchResult,
    count: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
    maxRetries: number = 3
  ): Promise<GeneratedQuestion[]> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateBatch(research, count, difficulty)
      } catch (error) {
        lastError = error as Error
        console.error(`Generation attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`)
  }
}