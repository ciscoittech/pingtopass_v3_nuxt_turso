import { useDB } from '~/server/utils/db'
import { users } from '~/server/database/schema/users'
import { eq } from 'drizzle-orm'
import { parseCookies } from 'h3'

export default defineEventHandler(async (event) => {
  console.log('🔍 Auth Debug Endpoint')
  
  // Get session data
  const session = await getUserSession(event)
  
  // Get raw cookie data
  const cookies = parseCookies(event)
  const sessionCookie = cookies['nuxt-session'] || 'No session cookie found'
  
  let dbUser = null
  let dbError = null
  
  // If we have a session with user, try to fetch from database
  if (session?.user?.email) {
    try {
      const db = useDB()
      const result = await db.select().from(users).where(eq(users.email, session.user.email)).get()
      dbUser = result
    } catch (error) {
      dbError = error.message
    }
  }
  
  // Build debug response
  const debugInfo = {
    timestamp: new Date().toISOString(),
    sessionExists: !!session,
    sessionData: session,
    sessionCookiePresent: !!cookies['nuxt-session'],
    sessionCookieLength: sessionCookie.length,
    userInSession: !!session?.user,
    userEmail: session?.user?.email || 'No email in session',
    userId: session?.user?.id || 'No ID in session',
    userFullName: session?.user?.fullName || 'No fullName in session',
    databaseUser: dbUser,
    databaseError: dbError,
    headers: {
      'user-agent': event.headers.get('user-agent'),
      'referer': event.headers.get('referer'),
      'cookie-count': Object.keys(cookies).length
    }
  }
  
  console.log('🔍 Debug info:', JSON.stringify(debugInfo, null, 2))
  
  return debugInfo
})