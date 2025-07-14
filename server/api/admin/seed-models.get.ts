import { useDB } from '~/server/utils/db'
import { ensureAdmin } from '~/server/utils/auth'
import { modelSettings } from '~/server/database/schema/settings'
import { defaultModelSettings } from '~/server/database/schema/settings'

export default defineEventHandler(async (event) => {
  await ensureAdmin(event)
  const db = useDB()
  
  const results = []
  
  for (const setting of defaultModelSettings) {
    try {
      await db.insert(modelSettings).values(setting)
      results.push({ feature: setting.feature, status: 'created', model: setting.modelName })
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        results.push({ feature: setting.feature, status: 'exists', model: setting.modelName })
      } else {
        results.push({ feature: setting.feature, status: 'error', error: error.message })
      }
    }
  }
  
  return {
    success: true,
    results
  }
})