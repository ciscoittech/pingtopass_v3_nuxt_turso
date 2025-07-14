import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'
import { LangChainClient } from '../client'
import type { Question, GenerateQuestionsInput, GenerateQuestionsOutput } from '../types'
import { nanoid } from 'nanoid'

// Define the schema for structured output
const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(5),
  correctAnswer: z.enum(['A', 'B', 'C', 'D', 'E']),
  explanation: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional()
})

const questionsResponseSchema = z.object({
  questions: z.array(questionSchema)
})

export class QuestionGenerator {
  private client: LangChainClient
  private parser: StructuredOutputParser<z.infer<typeof questionsResponseSchema>>

  constructor() {
    this.client = new LangChainClient()
    this.parser = StructuredOutputParser.fromZodSchema(questionsResponseSchema)
  }

  async generate(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
    try {
      console.log('[Generator] Starting generation with input:', input)
      
      const prompt = await this.buildPrompt(input)
      console.log('[Generator] Built prompt:', prompt.substring(0, 200) + '...')
      
      const response = await this.callLLM(prompt)
      console.log('[Generator] LLM response received, content length:', response.content?.length)
      
      const questions = this.parseResponse(response.content)
      console.log('[Generator] Parsed questions:', questions?.length || 0)
      
      // Validate and format questions
      const formattedQuestions = questions.map(q => {
        this.validateQuestion(q)
        return {
          ...q,
          id: `q_${nanoid(12)}`,
          difficulty: q.difficulty || input.difficulty || 'medium',
          objective: input.objective,
          questionType: 'multiple-choice' as const
        }
      })

      return {
        questions: formattedQuestions,
        metadata: {
          examCode: input.examCode,
          examName: input.examName,
          objective: input.objective,
          count: input.count,
          difficulty: input.difficulty,
          generatedAt: new Date().toISOString(),
          modelUsed: 'google/gemini-2.5-flash-preview-05-20',
          totalTokens: response.usage.totalTokens,
          cost: this.calculateCost(response.usage.totalTokens)
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to generate questions: ${error.message}`)
    }
  }

  private async buildPrompt(input: GenerateQuestionsInput): Promise<string> {
    const template = PromptTemplate.fromTemplate(`
You are an expert IT certification exam question generator. Generate {count} high-quality multiple-choice questions for the {examCode} ({examName}) certification exam.

Focus on the objective: "{objective}"
{objectiveDescription}

Requirements:
1. Each question must test practical, real-world knowledge
2. Include exactly 5 options labeled A), B), C), D), and E)
3. Only one correct answer per question
4. Provide detailed explanations for why the correct answer is right and why others are wrong
5. Questions should be {difficulty} difficulty level
6. Focus on scenarios and practical applications, not memorization

{customPrompt}

{formatInstructions}

Generate exactly {count} questions in the specified JSON format.
`)

    const formatInstructions = this.parser.getFormatInstructions()
    
    return await template.format({
      count: input.count,
      examCode: input.examCode,
      examName: input.examName,
      objective: input.objective,
      objectiveDescription: input.objectiveDescription || '',
      difficulty: input.difficulty || 'medium',
      customPrompt: input.customPrompt ? `Additional instructions: ${input.customPrompt}` : '',
      formatInstructions
    })
  }

  private async callLLM(prompt: string) {
    console.log('[Generator] Calling LLM with prompt')
    try {
      const result = await this.client.invoke(prompt, {
        temperature: 0.8,
        maxTokens: 3000
      })
      console.log('[Generator] LLM call successful')
      return result
    } catch (error: any) {
      console.error('[Generator] LLM call error:', error)
      throw error
    }
  }

  private parseResponse(content: string): Question[] {
    console.log('[Generator] parseResponse called with content length:', content?.length)
    console.log('[Generator] First 500 chars of content:', content?.substring(0, 500))
    
    try {
      // Try to parse as structured output first
      console.log('[Generator] Attempting structured parse...')
      const parsed = this.parser.parse(content)
      console.log('[Generator] Structured parse result:', parsed)
      
      if (!parsed || !parsed.questions) {
        throw new Error('Parsed result missing questions array')
      }
      
      return parsed.questions as Question[]
    } catch (error: any) {
      console.log('[Generator] Structured parse failed:', error.message)
      console.log('[Generator] Attempting JSON extraction fallback...')
      
      // Fallback: try to extract JSON from the response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/m)
      if (jsonMatch) {
        let jsonStr = jsonMatch[1] || jsonMatch[0]
        console.log('[Generator] Found JSON match, attempting parse...')
        
        // Clean up common JSON issues
        // Remove trailing commas in arrays
        jsonStr = jsonStr.replace(/,\s*]/g, ']')
        // Remove trailing commas in objects
        jsonStr = jsonStr.replace(/,\s*}/g, '}')
        // Remove any backticks that might have been included
        jsonStr = jsonStr.replace(/```/g, '')
        
        console.log('[Generator] Cleaned JSON, attempting parse...')
        
        try {
          const json = JSON.parse(jsonStr)
          console.log('[Generator] JSON parse successful:', json)
          
          if (!json.questions || !Array.isArray(json.questions)) {
            throw new Error('JSON missing questions array')
          }
          
          return json.questions
        } catch (parseError: any) {
          console.error('[Generator] JSON parse error:', parseError.message)
          console.log('[Generator] JSON string that failed:', jsonStr.substring(0, 200))
          
          // Last resort: try to manually extract the array
          try {
            const questionsMatch = jsonStr.match(/"questions"\s*:\s*\[([\s\S]*?)\]/);
            if (questionsMatch) {
              const questionsArrayStr = `[${questionsMatch[1]}]`;
              const cleanedQuestionsStr = questionsArrayStr
                .replace(/,\s*]/g, ']')
                .replace(/,\s*}/g, '}');
              const questionsArray = JSON.parse(cleanedQuestionsStr);
              console.log('[Generator] Manual extraction successful');
              return questionsArray;
            }
          } catch (manualError: any) {
            console.error('[Generator] Manual extraction also failed:', manualError.message)
          }
        }
      }
      
      throw new Error('Failed to parse LLM response - no valid JSON found')
    }
  }

  validateQuestion(question: Partial<Question>): void {
    if (!question.question || typeof question.question !== 'string') {
      throw new Error('Invalid question format: missing question text')
    }
    
    if (!question.options || !Array.isArray(question.options)) {
      throw new Error('Invalid question format: missing options array')
    }
    
    if (question.options.length !== 5) {
      throw new Error(`Invalid question format: expected 5 options, got ${question.options.length}`)
    }
    
    if (!question.correctAnswer || !['A', 'B', 'C', 'D', 'E'].includes(question.correctAnswer)) {
      throw new Error('Invalid question format: correctAnswer must be A, B, C, D, or E')
    }
    
    if (!question.explanation || typeof question.explanation !== 'string' || question.explanation.length < 10) {
      throw new Error('Invalid question format: missing or insufficient explanation')
    }

    // Ensure options are properly formatted (optional check)
    question.options.forEach((option, index) => {
      const expectedPrefix = `${String.fromCharCode(65 + index)})`
      if (!option.startsWith(expectedPrefix)) {
        console.warn(`Option ${index + 1} doesn't start with "${expectedPrefix}", but continuing...`)
      }
    })
  }

  private calculateCost(totalTokens: number): number {
    // Gemini 2.5 Flash pricing: $0.075 per 1M input tokens, $0.30 per 1M output tokens
    // Using average for simplicity
    const costPerMillion = 0.1875
    return (totalTokens / 1_000_000) * costPerMillion
  }
}