import { useDB } from '~/server/utils/db'
import { modelSettings } from '~/server/database/schema/settings'
import { sql } from 'drizzle-orm'

export default defineNitroPlugin(async () => {
  console.log('Checking model settings...')
  
  try {
    const db = useDB()
    
    // Check if we need to update models
    const existingSettings = await db.select().from(modelSettings)
    
    // If no settings or old models, update them
    if (existingSettings.length === 0 || existingSettings.some(s => s.modelId === 'deepseek/deepseek-chat')) {
      console.log('Updating to new faster models...')
      
      // Clear old settings
      await db.delete(modelSettings).run()
      
      // Insert new model settings
      const newSettings = [
        {
          id: 'ms_chat_user',
          feature: 'chat_user',
          modelId: 'google/gemini-2.5-flash-preview-05-20',
          modelName: 'Gemini 2.5 Flash Preview',
          provider: 'google',
          capabilities: JSON.stringify({ toolCalling: true, streaming: true, vision: true }),
          costPerMillion: 0.19
        },
        {
          id: 'ms_chat_admin',
          feature: 'chat_admin',
          modelId: 'google/gemini-2.5-flash-preview-05-20',
          modelName: 'Gemini 2.5 Flash Preview',
          provider: 'google',
          capabilities: JSON.stringify({ toolCalling: true, streaming: true, vision: true }),
          costPerMillion: 0.19
        },
        {
          id: 'ms_question_generation',
          feature: 'question_generation',
          modelId: 'google/gemini-2.5-flash-lite-preview-06-17',
          modelName: 'Gemini 2.5 Flash Lite',
          provider: 'google',
          capabilities: JSON.stringify({ toolCalling: true, streaming: true, vision: true }),
          costPerMillion: 0.095
        },
        {
          id: 'ms_twitter_analysis',
          feature: 'twitter_analysis',
          modelId: 'deepseek/deepseek-r1-0528',
          modelName: 'DeepSeek R1 (0528)',
          provider: 'deepseek',
          capabilities: JSON.stringify({ toolCalling: false, streaming: true, reasoning: true }),
          costPerMillion: 1.37
        }
      ]
      
      for (const setting of newSettings) {
        await db.insert(modelSettings).values(setting)
      }
      
      console.log('✅ Model settings updated to new faster models')
    }
  } catch (error) {
    console.error('Error updating model settings:', error)
  }
})