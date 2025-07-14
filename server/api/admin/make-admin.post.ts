import { useDB } from '~/server/utils/db'
import { users } from '~/server/database/schema/users'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // IMPORTANT: This is for development only!
  // In production, this should be properly secured
  
  // Skip admin check for this endpoint to allow initial admin setup
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }
  
  const body = await readBody(event)
  const { email } = body
  
  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }
  
  try {
    const db = useDB()
    
    // Update user to be admin
    const result = await db
      .update(users)
      .set({ 
        superAdmin: true,
        updated_at: Math.floor(Date.now() / 1000)
      })
      .where(eq(users.email, email))
      .returning()
    
    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    return {
      success: true,
      message: `User ${email} is now an admin`
    }
  } catch (error) {
    console.error('Error making user admin:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user'
    })
  }
})