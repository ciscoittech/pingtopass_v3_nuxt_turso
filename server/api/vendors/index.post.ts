import { useDB } from '~/server/utils/db'
import { vendors } from '~/server/database/schema/vendors'
import { generateVendorId } from '~/server/utils/id'

export default defineEventHandler(async (event) => {
  try {
    // Get request body
    const body = await readBody(event)
    
    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Vendor name is required'
      })
    }
    
    const db = useDB()
    
    // Create new vendor
    const newVendor = {
      id: generateVendorId(),
      name: body.name,
      description: body.description || null,
      website: body.website || null,
      logoUrl: body.logoUrl || null,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    }
    
    await db.insert(vendors).values(newVendor)
    
    return {
      success: true,
      data: newVendor
    }
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create vendor'
    })
  }
})