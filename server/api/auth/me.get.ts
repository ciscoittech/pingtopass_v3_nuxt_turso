export default defineEventHandler(async (event) => {
  console.log('📝 /api/auth/me - fetching user session')
  const session = await getUserSession(event)
  
  console.log('📝 /api/auth/me - session data:', JSON.stringify(session, null, 2))
  
  if (!session || !session.user) {
    console.log('📝 /api/auth/me - no session or user found')
    return { user: null }
  }
  
  console.log('📝 /api/auth/me - returning user:', session.user.email)
  return { user: session.user }
})