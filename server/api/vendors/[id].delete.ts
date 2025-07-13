import { useDB } from '~/server/utils/db'
import { vendors, exams } from '~/server/database/schema'
import { eq, sql } from 'drizzle-orm'

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
    
    // Check if vendor has exams
    const vendorExams = await db
      .select({ count: sql<number>`count(*)` })
      .from(exams)
      .where(eq(exams.vendorId, vendorId))
      .get()
    
    if (vendorExams && vendorExams.count > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot delete vendor with existing exams'
      })
    }
    
    // Delete vendor
    await db
      .delete(vendors)
      .where(eq(vendors.id, vendorId))
    
    return {
      success: true,
      message: 'Vendor deleted successfully'
    }
  } catch (error: any) {
    console.error('Error deleting vendor:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete vendor'
    })
  }
})