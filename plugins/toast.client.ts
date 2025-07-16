export default defineNuxtPlugin((nuxtApp) => {
  const showToast = (message: string, options: any = {}) => {
    const { $vuetify } = nuxtApp
    
    // Create a temporary container for the snackbar
    const snackbar = {
      show: true,
      message,
      color: options.color || 'grey-darken-3',
      timeout: options.timeout || 3000,
      location: options.location || 'bottom',
      position: options.position || 'fixed',
      rounded: options.rounded || 'pill',
      elevation: options.elevation || 8,
    }
    
    // You would typically use a global store or event bus here
    // For now, we'll use a simple console log
    console.log('Toast:', message, options)
  }
  
  return {
    provide: {
      toast: {
        success: (message: string, options?: any) => showToast(message, { ...options, color: 'success' }),
        error: (message: string, options?: any) => showToast(message, { ...options, color: 'error' }),
        warning: (message: string, options?: any) => showToast(message, { ...options, color: 'warning' }),
        info: (message: string, options?: any) => showToast(message, { ...options, color: 'info' }),
        show: showToast
      }
    }
  }
})