import { sql } from 'drizzle-orm'
import { users } from '../database/schema'

export default defineEventHandler(async (event) => {
  try {
    const db = useDB()
    
    // Test database connection by counting users
    const result = await db.select({ count: sql<number>`COUNT(*)` }).from(users).get()
    
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      userCount: result?.count || 0
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database connection failed',
      data: error
    })
  }
})