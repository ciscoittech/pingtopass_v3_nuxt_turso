import { useDB } from '~/server/utils/db'
import { users } from '~/server/database/schema/users'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Development only - remove in production!
  
  const session = await getUserSession(event)
  if (!session?.user) {
    return { error: 'Not logged in' }
  }
  
  try {
    const db = useDB()
    
    // Get user from database
    const dbUser = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        superAdmin: users.superAdmin,
        emailVerified: users.emailVerified,
        banned: users.banned
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get()
    
    return {
      session: {
        userId: session.user.id,
        email: session.user.email,
        isAdmin: session.user.isAdmin
      },
      database: dbUser,
      mismatch: dbUser && (dbUser.superAdmin !== session.user.isAdmin)
    }
  } catch (error) {
    return { error: error.message }
  }
})