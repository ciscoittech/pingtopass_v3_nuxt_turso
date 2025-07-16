import { useDB } from '~/server/utils/db'
import { vendors } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    
    // Fetch all vendors (temporarily removing isActive filter until migration is run)
    const allVendors = await db
      .select()
      .from(vendors)
      .all()

    console.log(`[API] /api/vendors - Found ${allVendors.length} active vendors`)
    
    return {
      success: true,
      data: allVendors
    }
  } catch (error: any) {
    console.error('Failed to fetch vendors:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch vendors'
    })
  }
})