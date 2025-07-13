import type { User } from '../database/schema'
import { users } from '../database/schema'
import { eq } from 'drizzle-orm'
import { generateUserId } from './id'

export async function ensureUser(event: any) {
  const session = await getUserSession(event)
  
  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return session.user
}

export async function ensureAdmin(event: any) {
  const user = await ensureUser(event)
  
  if (!user.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Admin access required'
    })
  }

  return user
}

export async function findOrCreateUser(profile: {
  email: string
  name?: string
  googleId?: string
}) {
  const db = useDB()
  
  // Try to find existing user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, profile.email))
    .get()
  
  if (existingUser) {
    // Update Google ID if not set
    if (profile.googleId && !existingUser.googleId) {
      await db
        .update(users)
        .set({ googleId: profile.googleId })
        .where(eq(users.id, existingUser.id))
    }
    return existingUser
  }
  
  // Create new user
  const newUser: typeof users.$inferInsert = {
    id: generateUserId(),
    email: profile.email,
    fullName: profile.name || profile.email.split('@')[0],
    googleId: profile.googleId,
    isActive: true,
    isAdmin: false,
  }
  
  await db.insert(users).values(newUser)
  
  return newUser
}