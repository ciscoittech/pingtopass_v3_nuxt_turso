export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log('🔓 Auth middleware - checking route:', to.path)
  
  // Skip auth check for public routes
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/oauth/google', '/auth/logout', '/', '/health', '/test-basic'];
  if (publicRoutes.includes(to.path)) {
    console.log('🔓 Auth middleware - public route, skipping auth check')
    return;
  }

  // Prevent redirect loops
  if (from.path === '/auth/login' && to.path === '/auth/login') {
    console.log('🔓 Auth middleware - preventing redirect loop')
    return;
  }

  // Check if user is authenticated
  try {
    console.log('🔓 Auth middleware - fetching /api/auth/me')
    const startTime = performance.now()
    const response = await $fetch('/api/auth/me');
    const duration = performance.now() - startTime
    console.log(`🔓 Auth middleware - response received in ${duration.toFixed(2)}ms:`, response)
    
    if (!response?.user) {
      console.log('🔓 Auth middleware - no user in response, redirecting to login')
      // Only redirect to login if we're not already going there
      if (to.path !== '/auth/login') {
        return navigateTo('/auth/login');
      }
    } else {
      console.log('🔓 Auth middleware - user authenticated:', response.user.email)
    }
  } catch (error) {
    console.error('🔓 Auth middleware - auth check failed:', error);
    // Only redirect to login if we're not already going there
    if (to.path !== '/auth/login') {
      return navigateTo('/auth/login');
    }
  }
})