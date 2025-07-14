import { openRouterClient, type OpenRouterMessage, type Tool as OpenRouterTool, type ToolCall } from './openrouter'
import { getModelById } from './modelRegistry'
import type { ChatSession, ChatMessage } from '../database/schema/chat'

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ChatTool {
  name: string
  description: string
  parameters: Record<string, any>
}

export interface ChatAgentOptions {
  modelId: string
  enableTools?: boolean
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export class ChatAgent {
  private modelId: string
  private enableTools: boolean
  private systemPrompt: string
  private maxTokens: number
  private temperature: number

  constructor(options: ChatAgentOptions) {
    this.modelId = options.modelId
    this.enableTools = options.enableTools || false
    this.systemPrompt = options.systemPrompt || ''
    this.maxTokens = options.maxTokens || 2000
    this.temperature = options.temperature || 0.7
  }

  async chat(messages: Message[], tools?: ChatTool[]): Promise<{ content: string | null; usage?: any; toolCalls?: ToolCall[] }> {
    // Validate model supports tool calling if tools are provided
    if (tools && tools.length > 0) {
      const modelInfo = getModelById(this.modelId)
      if (!modelInfo?.capabilities.toolCalling) {
        throw new Error(`Model ${this.modelId} does not support tool calling`)
      }
    }

    // Build messages with system prompt
    const fullMessages: OpenRouterMessage[] = []
    if (this.systemPrompt) {
      fullMessages.push({ role: 'system', content: this.systemPrompt })
    }
    fullMessages.push(...messages as OpenRouterMessage[])

    // Convert tools to OpenRouter format
    const openRouterTools: OpenRouterTool[] | undefined = tools?.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }))

    // Call OpenRouter with tools if provided
    const response = await openRouterClient.chat({
      model: this.modelId,
      messages: fullMessages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      tools: openRouterTools,
      tool_choice: openRouterTools ? 'auto' : undefined
    })

    const message = response.choices[0]?.message
    
    return {
      content: message?.content || null,
      usage: response.usage,
      toolCalls: message?.tool_calls
    }
  }

  // Execute tool calls and get final response
  async chatWithTools(
    messages: Message[], 
    tools: ChatTool[], 
    toolExecutor: (name: string, args: any) => Promise<any>
  ): Promise<{ content: string; usage?: any; totalUsage?: any }> {
    let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    const conversationMessages = [...messages]
    
    // Initial chat with tools
    const initialResponse = await this.chat(conversationMessages, tools)
    
    if (initialResponse.usage) {
      totalUsage.prompt_tokens += initialResponse.usage.prompt_tokens
      totalUsage.completion_tokens += initialResponse.usage.completion_tokens
      totalUsage.total_tokens += initialResponse.usage.total_tokens
    }

    // If no tool calls, return the response
    if (!initialResponse.toolCalls || initialResponse.toolCalls.length === 0) {
      return {
        content: initialResponse.content || '',
        usage: initialResponse.usage,
        totalUsage
      }
    }

    // Add assistant message with tool calls
    conversationMessages.push({
      role: 'assistant',
      content: initialResponse.content || '',
      tool_calls: initialResponse.toolCalls
    })

    // Execute each tool call
    for (const toolCall of initialResponse.toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments)
        const result = await toolExecutor(toolCall.function.name, args)
        
        // Add tool response to conversation
        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: typeof result === 'string' ? result : JSON.stringify(result)
        })
      } catch (error) {
        // Add error response
        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `Error executing tool: ${error}`
        })
      }
    }

    // Get final response after tool execution
    const finalResponse = await this.chat(conversationMessages)
    
    if (finalResponse.usage) {
      totalUsage.prompt_tokens += finalResponse.usage.prompt_tokens
      totalUsage.completion_tokens += finalResponse.usage.completion_tokens
      totalUsage.total_tokens += finalResponse.usage.total_tokens
    }

    return {
      content: finalResponse.content || '',
      usage: finalResponse.usage,
      totalUsage
    }
  }

  // Format chat history from database
  static formatChatHistory(messages: ChatMessage[]): Message[] {
    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content || ''
    }))
  }

  // Create context-aware system prompt
  static createSystemPrompt(context: {
    isAdmin: boolean
    examContext?: string
    userProgress?: any
  }): string {
    if (context.isAdmin) {
      return `You are an AI assistant for PingToPass administrators. You have access to system data and can help with:
- Analyzing user progress and performance
- Generating insights from analytics data  
- Managing questions and exams
- Troubleshooting issues
- Providing recommendations for content improvement

Be professional, data-driven, and provide actionable insights.`
    }

    let prompt = `You are a helpful AI study assistant for PingToPass, an IT certification exam preparation platform. 
Your role is to help users prepare for their certification exams by:
- Answering questions about exam topics
- Explaining concepts clearly
- Providing study tips and strategies
- Encouraging consistent study habits`

    if (context.examContext) {
      prompt += `\n\nThe user is currently studying for: ${context.examContext}`
    }

    if (context.userProgress) {
      prompt += `\n\nUser progress: ${JSON.stringify(context.userProgress)}`
    }

    return prompt
  }
}