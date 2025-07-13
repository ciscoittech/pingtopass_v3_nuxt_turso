export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth check for public routes
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/oauth/google', '/', '/health'];
  if (publicRoutes.includes(to.path)) {
    return;
  }

  // Check if user is authenticated
  try {
    const response = await $fetch('/api/auth/me');
    
    if (!response?.user) {
      return navigateTo('/auth/login');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return navigateTo('/auth/login');
  }
})