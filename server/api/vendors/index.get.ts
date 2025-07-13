import { useDB } from '~/server/utils/db'
import { vendors } from '~/server/database/schema/vendors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    
    const results = await db
      .select()
      .from(vendors)
      .all()
    
    return {
      success: true,
      data: results
    }
  } catch (error) {
    console.error('Error fetching vendors:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch vendors'
    })
  }
})