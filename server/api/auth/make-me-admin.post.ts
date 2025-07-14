import { useDB } from '~/server/utils/db'
import { users } from '~/server/database/schema/users'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // IMPORTANT: This is for development only!
  // Remove this file in production!
  
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'You must be logged in'
    })
  }
  
  try {
    const db = useDB()
    
    // Update current user to be admin
    const result = await db
      .update(users)
      .set({ 
        superAdmin: true,
        updated_at: Math.floor(Date.now() / 1000)
      })
      .where(eq(users.id, session.user.id))
      .returning()
    
    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    // Update the session
    await setUserSession(event, {
      ...session,
      user: {
        ...session.user,
        isAdmin: true
      }
    })
    
    return {
      success: true,
      message: `You are now an admin! Please refresh the page.`
    }
  } catch (error) {
    console.error('Error making user admin:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user'
    })
  }
})