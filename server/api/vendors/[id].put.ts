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
    const body = await readBody(event)
    const db = useDB()
    
    // Check if vendor exists
    const existingVendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .get()
    
    if (!existingVendor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Vendor not found'
      })
    }
    
    // Update vendor
    const updates = {
      name: body.name ?? existingVendor.name,
      description: body.description ?? existingVendor.description,
      website: body.website ?? existingVendor.website,
      logoUrl: body.logoUrl ?? existingVendor.logoUrl,
      updatedAt: Math.floor(Date.now() / 1000),
    }
    
    await db
      .update(vendors)
      .set(updates)
      .where(eq(vendors.id, vendorId))
    
    return {
      success: true,
      data: {
        ...existingVendor,
        ...updates
      }
    }
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update vendor'
    })
  }
})