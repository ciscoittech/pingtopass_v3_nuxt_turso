import { useDB } from '~/server/utils/db'
import { modelSettings } from '~/server/database/schema'
import { MODEL_REGISTRY, getModelsByFeature } from '~/server/utils/modelRegistry'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication and admin role
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    if (!session.user.role || session.user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const query = getQuery(event)
    const feature = query.feature as string

    const db = useDB()

    // Get current model settings
    const currentSettings = await db
      .select()
      .from(modelSettings)

    // Get available models
    let availableModels: any = MODEL_REGISTRY

    // Filter by feature if specified
    if (feature && ['chat_user', 'chat_admin', 'question_generation', 'twitter_analysis'].includes(feature)) {
      const filteredModels = getModelsByFeature(feature as any)
      availableModels = Object.fromEntries(filteredModels)
    }

    // Format response
    const response = {
      success: true,
      currentSettings: currentSettings.reduce((acc, setting) => {
        acc[setting.feature] = {
          modelId: setting.modelId,
          modelName: setting.modelName,
          provider: setting.provider,
          costPerMillion: setting.costPerMillion,
          updatedAt: setting.updatedAt
        }
        return acc
      }, {} as Record<string, any>),
      availableModels: Object.entries(availableModels).map(([id, info]) => ({
        id,
        ...info,
        averageCost: (info.cost.input + info.cost.output) / 2
      })),
      features: [
        {
          id: 'chat_user',
          name: 'User Chat',
          description: 'Chat assistant for users studying for exams',
          requiresToolCalling: false
        },
        {
          id: 'chat_admin',
          name: 'Admin Chat',
          description: 'Admin chat with access to system tools and analytics',
          requiresToolCalling: true
        },
        {
          id: 'question_generation',
          name: 'Question Generation',
          description: 'AI-powered question generation for exams',
          requiresToolCalling: false
        },
        {
          id: 'twitter_analysis',
          name: 'Twitter Analysis',
          description: 'Competitor and content analysis for Twitter',
          requiresToolCalling: false
        }
      ]
    }

    return response

  } catch (error: any) {
    console.error('Get model settings error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to get model settings'
    })
  }
})