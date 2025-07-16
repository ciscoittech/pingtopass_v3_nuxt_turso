import { handleAuthError } from '../plugins/errorHandler'

// Middleware to ensure user is authenticated for session endpoints
export default defineEventHandler(async (event) => {
  // Only apply to session API routes
  if (!event.node.req.url?.startsWith('/api/sessions/')) {
    return
  }

  // Skip for OPTIONS requests (CORS preflight)
  if (event.node.req.method === 'OPTIONS') {
    return
  }

  try {
    // Get user session
    const session = await getUserSession(event)
    
    if (!session?.user?.id) {
      handleAuthError('Authentication required to access session endpoints')
    }

    // Add user ID to event context for easy access
    event.context.userId = session.user.id
    event.context.userEmail = session.user.email
    
  } catch (error) {
    console.error('Session auth middleware error:', error)
    handleAuthError()
  }
})