export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  temperature?: number
  max_tokens?: number
  tools?: any[]
}

export interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string | null
      tool_calls?: ToolCall[]
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

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pingtopass.com',
        'X-Title': 'PingToPass - Question Generation'
      },
      body: JSON.stringify({
        ...request,
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
  }

  async generateQuestions(prompt: string, model?: string): Promise<any> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert IT certification exam question generator. Generate high-quality questions that test practical knowledge.
        
Return your response as valid JSON with this structure:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "explanation": "Detailed explanation",
      "difficulty": "easy|medium|hard",
      "objective": "Learning objective"
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

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No content in response')
    
    return JSON.parse(content)
  }

  async validateQuestion(question: any): Promise<{ isValid: boolean; issues: string[]; suggestions: string[] }> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `Analyze this exam question for quality issues. Respond with JSON:
{
  "isValid": true/false,
  "issues": ["List of problems"],
  "suggestions": ["List of improvements"]
}`
      },
      {
        role: 'user',
        content: JSON.stringify(question)
      }
    ]

    const response = await this.chat({
      model: 'anthropic/claude-3.5-haiku',
      messages,
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No validation response')
    
    return JSON.parse(content)
  }
}