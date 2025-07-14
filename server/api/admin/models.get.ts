import { useDB } from '~/server/utils/db'
import { ensureAdmin } from '~/server/utils/auth'
import { modelSettings } from '~/server/database/schema/settings'
import { MODEL_REGISTRY } from '~/server/utils/modelRegistry'

export default defineEventHandler(async (event) => {
  await ensureAdmin(event)
  const db = useDB()

  // Get current model settings
  const settings = await db
    .select()
    .from(modelSettings)

  // Transform settings into a map by feature
  const currentSettings = settings.reduce((acc, setting) => {
    acc[setting.feature] = setting
    return acc
  }, {} as Record<string, any>)

  // Convert MODEL_REGISTRY to array format
  const availableModels = Object.entries(MODEL_REGISTRY).map(([id, info]) => ({
    id,
    ...info,
    averageCost: (info.cost.input + info.cost.output) / 2
  }))

  return {
    currentSettings,
    availableModels
  }
})