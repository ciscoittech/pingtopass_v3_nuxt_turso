export interface ModelCapabilities {
  toolCalling: boolean
  streaming: boolean
  reasoning?: boolean
  vision?: boolean
  maxTokens?: number
}

export interface ModelCost {
  input: number  // per 1M tokens
  output: number // per 1M tokens
}

export interface ModelInfo {
  provider: string
  name: string
  capabilities: ModelCapabilities
  cost: ModelCost
  speed: 'fast' | 'medium' | 'slow'
  quality: 'excellent' | 'good' | 'fair'
  contextWindow?: number
  description?: string
}

export const MODEL_REGISTRY: Record<string, ModelInfo> = {
  // Anthropic Models
  'anthropic/claude-3.5-sonnet': {
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    capabilities: { toolCalling: true, streaming: true, reasoning: true },
    cost: { input: 3.00, output: 15.00 },
    speed: 'medium',
    quality: 'excellent',
    contextWindow: 200000,
    description: 'Most intelligent model, great for complex tasks'
  },
  'anthropic/claude-3.5-haiku': {
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    capabilities: { toolCalling: false, streaming: true, reasoning: true },
    cost: { input: 1.00, output: 5.00 },
    speed: 'fast',
    quality: 'good',
    contextWindow: 200000,
    description: 'Fast and affordable, good for simple tasks'
  },
  'anthropic/claude-3-opus': {
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    capabilities: { toolCalling: true, streaming: true, reasoning: true },
    cost: { input: 15.00, output: 75.00 },
    speed: 'slow',
    quality: 'excellent',
    contextWindow: 200000,
    description: 'Previous generation top model'
  },

  // OpenAI Models
  'openai/gpt-4o': {
    provider: 'openai',
    name: 'GPT-4 Optimized',
    capabilities: { toolCalling: true, streaming: true, vision: true },
    cost: { input: 2.50, output: 10.00 },
    speed: 'fast',
    quality: 'excellent',
    contextWindow: 128000,
    description: 'Fast multimodal model with vision'
  },
  'openai/gpt-4o-mini': {
    provider: 'openai',
    name: 'GPT-4 Optimized Mini',
    capabilities: { toolCalling: true, streaming: true, vision: true },
    cost: { input: 0.15, output: 0.60 },
    speed: 'fast',
    quality: 'good',
    contextWindow: 128000,
    description: 'Affordable and fast for most tasks'
  },
  'openai/gpt-4-turbo': {
    provider: 'openai',
    name: 'GPT-4 Turbo',
    capabilities: { toolCalling: true, streaming: true, vision: true },
    cost: { input: 10.00, output: 30.00 },
    speed: 'medium',
    quality: 'excellent',
    contextWindow: 128000,
    description: 'Powerful model with vision capabilities'
  },
  'openai/o1-preview': {
    provider: 'openai',
    name: 'o1 Preview (Reasoning)',
    capabilities: { toolCalling: false, streaming: false, reasoning: true },
    cost: { input: 15.00, output: 60.00 },
    speed: 'slow',
    quality: 'excellent',
    contextWindow: 128000,
    description: 'Advanced reasoning model for complex problems'
  },
  'openai/o1-mini': {
    provider: 'openai',
    name: 'o1 Mini (Reasoning)',
    capabilities: { toolCalling: false, streaming: false, reasoning: true },
    cost: { input: 3.00, output: 12.00 },
    speed: 'medium',
    quality: 'excellent',
    contextWindow: 128000,
    description: 'Smaller reasoning model, more affordable'
  },

  // DeepSeek Models
  'deepseek/deepseek-chat': {
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    capabilities: { toolCalling: false, streaming: true, reasoning: true },
    cost: { input: 0.14, output: 0.28 },
    speed: 'slow', // Updated to reflect actual speed
    quality: 'good',
    contextWindow: 64000,
    description: 'Affordable but slower model'
  },
  'deepseek/deepseek-r1-0528': {
    provider: 'deepseek',
    name: 'DeepSeek R1 (0528)',
    capabilities: { toolCalling: false, streaming: true, reasoning: true },
    cost: { input: 0.55, output: 2.19 },
    speed: 'medium',
    quality: 'excellent',
    contextWindow: 64000,
    description: 'Latest R1 reasoning model'
  },

  // Google Models
  'google/gemini-2.5-flash-preview-05-20': {
    provider: 'google',
    name: 'Gemini 2.5 Flash Preview',
    capabilities: { toolCalling: true, streaming: true, vision: true },
    cost: { input: 0.075, output: 0.30 },
    speed: 'fast',
    quality: 'excellent',
    contextWindow: 1000000,
    description: 'Latest Gemini 2.5 - fastest and most capable'
  },
  'google/gemini-2.5-flash-lite-preview-06-17': {
    provider: 'google',
    name: 'Gemini 2.5 Flash Lite',
    capabilities: { toolCalling: true, streaming: true, vision: true },
    cost: { input: 0.04, output: 0.15 },
    speed: 'fast',
    quality: 'good',
    contextWindow: 1000000,
    description: 'Ultra-fast lite version, very affordable'
  },
  'google/gemini-pro-1.5': {
    provider: 'google',
    name: 'Gemini Pro 1.5',
    capabilities: { toolCalling: true, streaming: true, vision: true },
    cost: { input: 1.25, output: 5.00 },
    speed: 'medium',
    quality: 'excellent',
    contextWindow: 2000000,
    description: 'Huge context window, multimodal'
  },
  'google/gemini-flash-1.5': {
    provider: 'google',
    name: 'Gemini Flash 1.5',
    capabilities: { toolCalling: true, streaming: true, vision: true },
    cost: { input: 0.075, output: 0.30 },
    speed: 'fast',
    quality: 'good',
    contextWindow: 1000000,
    description: 'Fast and affordable with large context'
  },
  'google/gemma-3-27b': {
    provider: 'google',
    name: 'Gemma 3 27B',
    capabilities: { toolCalling: false, streaming: true, vision: false },
    cost: { input: 0.10, output: 0.10 },
    speed: 'fast',
    quality: 'good',
    contextWindow: 8192,
    description: 'Open source Gemma model, very fast'
  },

  // Meta Models
  'meta-llama/llama-3.1-70b-instruct': {
    provider: 'meta',
    name: 'Llama 3.1 70B',
    capabilities: { toolCalling: true, streaming: true },
    cost: { input: 0.88, output: 0.88 },
    speed: 'medium',
    quality: 'good',
    contextWindow: 131072,
    description: 'Open source, good performance'
  },
  'meta-llama/llama-3.1-8b-instruct': {
    provider: 'meta',
    name: 'Llama 3.1 8B',
    capabilities: { toolCalling: true, streaming: true },
    cost: { input: 0.18, output: 0.18 },
    speed: 'fast',
    quality: 'fair',
    contextWindow: 131072,
    description: 'Small and fast open source model'
  },

  // Mistral Models
  'mistralai/mistral-large': {
    provider: 'mistral',
    name: 'Mistral Large',
    capabilities: { toolCalling: true, streaming: true },
    cost: { input: 3.00, output: 9.00 },
    speed: 'medium',
    quality: 'good',
    contextWindow: 128000,
    description: 'Mistral\'s flagship model'
  },
  'mistralai/mistral-medium': {
    provider: 'mistral',
    name: 'Mistral Medium',
    capabilities: { toolCalling: true, streaming: true },
    cost: { input: 2.70, output: 8.10 },
    speed: 'medium',
    quality: 'good',
    contextWindow: 32000,
    description: 'Balanced performance and cost'
  },

  // Qwen Models
  'qwen/qwen-2.5-72b-instruct': {
    provider: 'qwen',
    name: 'Qwen 2.5 72B',
    capabilities: { toolCalling: false, streaming: true },
    cost: { input: 0.90, output: 0.90 },
    speed: 'medium',
    quality: 'good',
    contextWindow: 131072,
    description: 'Large Chinese model, multilingual'
  },

  // Nous Models
  'nousresearch/hermes-3-llama-3.1-70b': {
    provider: 'nous',
    name: 'Hermes 3 Llama 70B',
    capabilities: { toolCalling: true, streaming: true },
    cost: { input: 0.59, output: 0.79 },
    speed: 'medium',
    quality: 'good',
    contextWindow: 131072,
    description: 'Fine-tuned for tool use'
  },
}

// Helper functions
export function getModelsByFeature(feature: 'chat_user' | 'chat_admin' | 'question_generation' | 'twitter_analysis') {
  const models = Object.entries(MODEL_REGISTRY)
  
  // For now, only show DeepSeek and Google models
  const allowedProviders = ['deepseek', 'google']
  const filteredModels = models.filter(([_, info]) => 
    allowedProviders.includes(info.provider.toLowerCase())
  )
  
  switch (feature) {
    case 'chat_user':
      // For user chat, show fast models (including Gemma if we add it)
      return filteredModels.filter(([_, info]) => 
        info.speed === 'fast' || info.speed === 'medium'
      )
    
    case 'chat_admin':
      // Admin chat needs tool calling - only Google models support this
      return filteredModels.filter(([_, info]) => 
        info.capabilities.toolCalling === true
      )
    
    case 'question_generation':
      // Question generation - show all available models
      return filteredModels
    
    case 'twitter_analysis':
      // Twitter analysis needs good reasoning, affordability for bulk processing
      return filteredModels.filter(([_, info]) => 
        info.cost.input < 5.0
      )
    
    default:
      return filteredModels
  }
}

export function getModelById(modelId: string): ModelInfo | undefined {
  return MODEL_REGISTRY[modelId]
}

export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = MODEL_REGISTRY[modelId]
  if (!model) return 0
  
  const inputCost = (inputTokens / 1_000_000) * model.cost.input
  const outputCost = (outputTokens / 1_000_000) * model.cost.output
  
  return inputCost + outputCost
}