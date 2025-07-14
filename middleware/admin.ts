export default defineNuxtRouteMiddleware(async (to, from) => {
  // Check if user is authenticated and is admin
  try {
    const response = await $fetch('/api/auth/me');
    
    if (!response?.user) {
      return navigateTo('/auth/login');
    }
    
    // Check if user is admin
    if (response.user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. Admin privileges required.'
      });
    }
  } catch (error) {
    console.error('Admin auth check failed:', error);
    if (error?.statusCode === 403) {
      throw error;
    }
    return navigateTo('/auth/login');
  }
})