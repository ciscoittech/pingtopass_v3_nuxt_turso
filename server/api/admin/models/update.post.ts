import { useDB } from '~/server/utils/db'
import { modelSettings } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { getModelById } from '~/server/utils/modelRegistry'

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

    const body = await readBody(event)
    const { feature, modelId } = body

    // Validate input
    const validFeatures = ['chat_user', 'chat_admin', 'question_generation', 'twitter_analysis']
    if (!feature || !validFeatures.includes(feature)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid feature specified'
      })
    }

    if (!modelId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Model ID is required'
      })
    }

    // Get model info from registry
    const modelInfo = getModelById(modelId)
    if (!modelInfo) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid model ID'
      })
    }

    // Validate model capabilities for the feature
    if (feature === 'chat_admin' && !modelInfo.capabilities.toolCalling) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Admin chat requires a model with tool calling support'
      })
    }

    const db = useDB()
    const settingId = `ms_${feature}`
    const avgCost = (modelInfo.cost.input + modelInfo.cost.output) / 2

    // Check if setting exists
    const existingSetting = await db
      .select()
      .from(modelSettings)
      .where(eq(modelSettings.id, settingId))
      .then(rows => rows[0])

    if (existingSetting) {
      // Update existing setting
      await db
        .update(modelSettings)
        .set({
          modelId,
          modelName: modelInfo.name,
          provider: modelInfo.provider,
          capabilities: JSON.stringify(modelInfo.capabilities),
          costPerMillion: avgCost,
          updatedBy: session.user.id,
          updatedAt: Math.floor(Date.now() / 1000)
        })
        .where(eq(modelSettings.id, settingId))
    } else {
      // Create new setting
      await db.insert(modelSettings).values({
        id: settingId,
        feature,
        modelId,
        modelName: modelInfo.name,
        provider: modelInfo.provider,
        capabilities: JSON.stringify(modelInfo.capabilities),
        costPerMillion: avgCost,
        updatedBy: session.user.id,
        updatedAt: Math.floor(Date.now() / 1000)
      })
    }

    // Log the change
    console.log(`Model setting updated: ${feature} -> ${modelId} by ${session.user.email}`)

    return {
      success: true,
      setting: {
        feature,
        modelId,
        modelName: modelInfo.name,
        provider: modelInfo.provider,
        costPerMillion: avgCost,
        capabilities: modelInfo.capabilities
      }
    }

  } catch (error: any) {
    console.error('Update model setting error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to update model setting'
    })
  }
})