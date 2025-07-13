import { useDB } from '~/server/utils/db'
import { vendors } from '~/server/database/schema/vendors'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const vendorId = getRouterParam(event, 'id')
  
  if (!vendorId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vendor ID is required'
    })
  }
  
  try {
    const db = useDB()
    
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .get()
    
    if (!vendor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Vendor not found'
      })
    }
    
    return {
      success: true,
      data: vendor
    }
  } catch (error: any) {
    console.error('Error fetching vendor:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch vendor'
    })
  }
})