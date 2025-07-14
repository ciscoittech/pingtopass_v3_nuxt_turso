export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth check for public routes
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/oauth/google', '/auth/logout', '/', '/health', '/test-basic'];
  if (publicRoutes.includes(to.path)) {
    return;
  }

  // Prevent redirect loops
  if (from.path === '/auth/login' && to.path === '/auth/login') {
    return;
  }

  // Check if user is authenticated
  try {
    const response = await $fetch('/api/auth/me');
    
    if (!response?.user) {
      // Only redirect to login if we're not already going there
      if (to.path !== '/auth/login') {
        return navigateTo('/auth/login');
      }
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    // Only redirect to login if we're not already going there
    if (to.path !== '/auth/login') {
      return navigateTo('/auth/login');
    }
  }
})