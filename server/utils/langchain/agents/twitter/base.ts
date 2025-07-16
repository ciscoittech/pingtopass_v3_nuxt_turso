import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { LangChainClient } from '../../client'
import type { z } from 'zod'

export abstract class BaseTwitterAgent<TInput, TOutput> {
  protected client: LangChainClient
  protected modelName: string
  protected temperature: number
  protected maxTokens: number

  constructor(
    modelName: string = 'google/gemini-2.5-flash-preview-05-20',
    temperature: number = 0.7,
    maxTokens: number = 2000
  ) {
    this.client = new LangChainClient()
    this.modelName = modelName
    this.temperature = temperature
    this.maxTokens = maxTokens
  }

  abstract getName(): string
  abstract getDescription(): string
  abstract process(input: TInput): Promise<TOutput>

  protected async callLLM(prompt: string): Promise<string> {
    console.log(`[${this.getName()}] Calling LLM with prompt length:`, prompt.length)
    
    try {
      const response = await this.client.invoke(prompt, {
        modelName: this.modelName,
        temperature: this.temperature,
        maxTokens: this.maxTokens
      })
      
      console.log(`[${this.getName()}] LLM response received, length:`, response.content.length)
      return response.content
    } catch (error: any) {
      console.error(`[${this.getName()}] LLM call failed:`, error)
      throw new Error(`${this.getName()} failed: ${error.message}`)
    }
  }

  protected async parseStructuredOutput<T>(
    content: string, 
    parser: StructuredOutputParser<T>
  ): Promise<T> {
    try {
      // Try structured parse first
      return parser.parse(content)
    } catch (error: any) {
      console.log(`[${this.getName()}] Structured parse failed, trying JSON extraction...`)
      
      // Fallback to JSON extraction
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/m)
      if (jsonMatch) {
        let jsonStr = jsonMatch[1] || jsonMatch[0]
        
        // Clean up common JSON issues
        jsonStr = jsonStr.replace(/,\s*]/g, ']')
        jsonStr = jsonStr.replace(/,\s*}/g, '}')
        jsonStr = jsonStr.replace(/```/g, '')
        
        try {
          const parsed = JSON.parse(jsonStr)
          return parsed as T
        } catch (parseError: any) {
          console.error(`[${this.getName()}] JSON parse error:`, parseError.message)
          throw new Error(`Failed to parse output: ${parseError.message}`)
        }
      }
      
      throw new Error('No valid JSON found in response')
    }
  }

  protected buildPrompt(template: string, variables: Record<string, any>): string {
    const prompt = PromptTemplate.fromTemplate(template)
    return prompt.formatPromptValue(variables).value
  }

  // Helper to format data for prompts
  protected formatDataForPrompt(data: any): string {
    if (typeof data === 'string') return data
    if (Array.isArray(data)) {
      return data.map(item => this.formatDataForPrompt(item)).join('\n')
    }
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data, null, 2)
    }
    return String(data)
  }

  // Helper to calculate cost
  protected calculateCost(tokens: number): number {
    // Gemini 2.5 Flash pricing: $0.075 per 1M input tokens, $0.30 per 1M output tokens
    const avgCostPerMillion = 0.1875
    return (tokens / 1_000_000) * avgCostPerMillion
  }
}