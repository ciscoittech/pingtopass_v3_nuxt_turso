import { useDB } from '~/server/utils/db'
import { generateUserId } from '~/server/utils/id'
import { users } from '~/server/database/schema/users'
import { eq } from 'drizzle-orm'

async function findOrCreateUser({ email, name, googleId }: { email: string, name: string, googleId: string }) {
  const db = useDB()
  
  // Try to find existing user
  const existingUser = await db.select().from(users).where(eq(users.email, email)).get()
  
  if (existingUser) {
    // Map existing user to expected format
    return {
      id: existingUser.id,
      email: existingUser.email,
      fullName: existingUser.name,
      isAdmin: existingUser.superAdmin || false,
      isActive: !existingUser.banned && existingUser.emailVerified
    }
  }
  
  // Create new user using actual schema
  const timestamp = Math.floor(Date.now() / 1000)
  const newUser = {
    id: generateUserId(),
    email,
    name,
    emailVerified: true,
    banned: false,
    superAdmin: false,
    onboarded: false,
    proAccount: false,
    created_at: timestamp,
    updated_at: timestamp
  }
  
  await db.insert(users).values(newUser)
  
  // Return in expected format
  return {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.name,
    isAdmin: newUser.superAdmin,
    isActive: !newUser.banned && newUser.emailVerified
  }
}

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile']
  },
  async onSuccess(event, { user }) {
    // Find or create user in our database
    const dbUser = await findOrCreateUser({
      email: user.email,
      name: user.name,
      googleId: user.sub
    })

    // Set user session
    await setUserSession(event, {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName,
        isAdmin: dbUser.isAdmin,
        isActive: dbUser.isActive
      }
    })

    // Redirect to dashboard
    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('OAuth error:', error)
    return sendRedirect(event, '/auth/login?error=oauth_failed')
  }
})