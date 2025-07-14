interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

interface OpenRouterResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenRouterClient {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required')
    }
  }

  async chat(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pingtopass.com',
          'X-Title': 'PingToPass - IT Certification Exam Prep'
        },
        body: JSON.stringify({
          ...request,
          // Default to fast, reliable model for question generation
          model: request.model || 'anthropic/claude-3.5-haiku',
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 2000
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`)
      }

      return await response.json()
    } catch (error) {
      console.error('OpenRouter API call failed:', error)
      throw error
    }
  }

  async generateQuestions(prompt: string, model?: string): Promise<string> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert IT certification exam question generator. Generate high-quality, realistic exam questions that:
1. Test practical knowledge and real-world scenarios
2. Include 4 multiple choice options with only one correct answer
3. Provide detailed explanations for why each answer is correct or incorrect
4. Follow industry-standard question formats
5. Are appropriately challenging for certification level

Format your response as valid JSON with this structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "explanation": "Detailed explanation of the correct answer and why others are wrong",
      "difficulty": "easy|medium|hard",
      "objective": "Learning objective this question tests"
    }
  ]
}`
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const response = await this.chat({
      model: model || 'anthropic/claude-3.5-haiku',
      messages,
      temperature: 0.8,
      max_tokens: 3000
    })

    return response.choices[0]?.message?.content || ''
  }

  async improveQuestion(questionText: string, feedback: string): Promise<string> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert at improving IT certification exam questions. Review the provided question and feedback, then generate an improved version that addresses the concerns while maintaining exam quality standards.

Return the improved question in the same JSON format as the original.`
      },
      {
        role: 'user',
        content: `Original Question: ${questionText}

Feedback: ${feedback}

Please provide an improved version of this question.`
      }
    ]

    const response = await this.chat({
      model: 'anthropic/claude-3.5-haiku',
      messages,
      temperature: 0.6
    })

    return response.choices[0]?.message?.content || ''
  }

  async validateQuestion(questionData: any): Promise<{ isValid: boolean; issues: string[]; suggestions: string[] }> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are a quality assurance expert for IT certification exams. Analyze the provided question and identify any issues with:
1. Question clarity and grammar
2. Answer option quality and plausibility
3. Correct answer accuracy
4. Explanation completeness
5. Difficulty appropriateness
6. Industry relevance

Respond with JSON in this format:
{
  "isValid": true/false,
  "issues": ["List of specific problems found"],
  "suggestions": ["List of improvement suggestions"]
}`
      },
      {
        role: 'user',
        content: `Please validate this exam question:

Question: ${questionData.question}
Options: ${questionData.options.join(', ')}
Correct Answer: ${questionData.correctAnswer}
Explanation: ${questionData.explanation}
Difficulty: ${questionData.difficulty}`
      }
    ]

    const response = await this.chat({
      model: 'anthropic/claude-3.5-haiku',
      messages,
      temperature: 0.3
    })

    try {
      return JSON.parse(response.choices[0]?.message?.content || '{"isValid": false, "issues": ["Failed to validate"], "suggestions": []}')
    } catch (error) {
      return {
        isValid: false,
        issues: ['Failed to parse validation response'],
        suggestions: ['Manual review required']
      }
    }
  }

  // Cost tracking helpers
  calculateCost(usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }, model: string): number {
    // Pricing per 1M tokens (as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'anthropic/claude-3.5-haiku': { input: 1.00, output: 5.00 },
      'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
      'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
      'openai/gpt-4o': { input: 2.50, output: 10.00 }
    }

    const modelPricing = pricing[model] || pricing['anthropic/claude-3.5-haiku']
    const inputCost = (usage.prompt_tokens / 1_000_000) * modelPricing.input
    const outputCost = (usage.completion_tokens / 1_000_000) * modelPricing.output
    
    return inputCost + outputCost
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient()