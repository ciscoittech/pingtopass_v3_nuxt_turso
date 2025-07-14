import { useDB } from '../server/utils/db'
import { modelSettings } from '../server/database/schema/settings'
import { defaultModelSettings } from '../server/database/schema/settings'

async function seedModelSettings() {
  const db = useDB()
  
  console.log('Seeding model settings...')
  
  for (const setting of defaultModelSettings) {
    try {
      await db.insert(modelSettings).values(setting)
      console.log(`✓ Added ${setting.feature} model: ${setting.modelName}`)
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        console.log(`- ${setting.feature} already exists`)
      } else {
        console.error(`✗ Error adding ${setting.feature}:`, error.message)
      }
    }
  }
  
  console.log('\nModel settings seeded!')
}

seedModelSettings().catch(console.error)