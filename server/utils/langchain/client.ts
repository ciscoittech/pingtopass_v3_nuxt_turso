import { ChatOpenAI } from '@langchain/openai'
import type { ModelOptions, ChatResponse } from './types'

export class LangChainClient {
  private initialized: boolean = false
  private tracingEnabled: boolean = false
  private defaultModel: string = 'google/gemini-2.5-flash-preview-05-20'

  constructor() {
    console.log('[Client] LangChainClient constructor called')
    // Check required environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required')
    }
    console.log('[Client] API key found, length:', process.env.OPENROUTER_API_KEY.length)

    // Initialize LangSmith tracing if enabled
    if (process.env.LANGCHAIN_TRACING_V2 === 'true') {
      this.tracingEnabled = true
      console.log('[Client] LangSmith tracing enabled')
    }

    this.initialized = true
    console.log('[Client] Client initialized')
  }

  isInitialized(): boolean {
    return this.initialized
  }

  isTracingEnabled(): boolean {
    return this.tracingEnabled
  }

  getChatModel(options: ModelOptions = {}): ChatOpenAI {
    const {
      modelName = this.defaultModel,
      temperature = 0.7,
      maxTokens = 2000,
      topP = 0.9
    } = options

    return new ChatOpenAI({
      modelName,
      temperature,
      maxTokens,
      topP,
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://pingtopass.com',
          'X-Title': 'PingToPass Question Generation'
        }
      }
    })
  }

  async invoke(prompt: string, options: ModelOptions = {}): Promise<ChatResponse> {
    try {
      console.log('[Client] invoke called with prompt length:', prompt.length)
      console.log('[Client] options:', options)
      
      const model = this.getChatModel(options)
      console.log('[Client] Model created')
      
      // Convert string prompt to proper message format
      const messages = [
        {
          role: 'user' as const,
          content: prompt
        }
      ]
      console.log('[Client] Messages prepared')
      
      const response = await model.invoke(messages)
      console.log('[Client] Model invoke complete, response type:', typeof response)
      console.log('[Client] Response keys:', Object.keys(response))
      
      // Extract content and usage information
      const content = response.content.toString()
      const usage = response.usage_metadata || {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0
      }

      console.log('[Client] Content extracted, length:', content.length)
      console.log('[Client] Usage:', usage)

      return {
        content,
        usage: {
          promptTokens: usage.input_tokens || 0,
          completionTokens: usage.output_tokens || 0,
          totalTokens: usage.total_tokens || 0
        }
      }
    } catch (error: any) {
      console.error('[Client] Error in invoke:', error)
      console.error('[Client] Error stack:', error.stack)
      throw error
    }
  }

  async stream(prompt: string, options: ModelOptions = {}) {
    console.log('[Client] stream method called')
    const model = this.getChatModel(options)
    // Convert string prompt to proper message format for streaming
    const messages = [
      {
        role: 'user' as const,
        content: prompt
      }
    ]
    const stream = await model.stream(messages)
    
    // Return an async generator that yields content chunks
    return {
      async *[Symbol.asyncIterator]() {
        for await (const chunk of stream) {
          yield {
            content: chunk.content.toString()
          }
        }
      }
    }
  }
}