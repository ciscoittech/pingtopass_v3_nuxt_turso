export function useNavigationState() {
  const isNavigating = useState<boolean>('navigation.isNavigating', () => false)
  const navigationError = useState<any>('navigation.error', () => null)
  const navigationRetries = useState<number>('navigation.retries', () => 0)
  
  const router = useRouter()
  
  // Navigation guard to track navigation state
  router.beforeEach((to, from) => {
    isNavigating.value = true
    navigationError.value = null
    console.log('[Navigation] Starting navigation from', from.path, 'to', to.path)
  })
  
  router.afterEach((to, from, failure) => {
    isNavigating.value = false
    if (failure) {
      console.error('[Navigation] Navigation failed:', failure)
      navigationError.value = failure
    } else {
      console.log('[Navigation] Navigation completed to', to.path)
      navigationRetries.value = 0
    }
  })
  
  router.onError((error) => {
    console.error('[Navigation] Router error:', error)
    navigationError.value = error
    isNavigating.value = false
  })
  
  // Safe navigation with retry
  async function safeNavigate(to: string | object, options: { replace?: boolean } = {}) {
    const maxRetries = 3
    let lastError: any
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        isNavigating.value = true
        navigationError.value = null
        
        if (options.replace) {
          await router.replace(to)
        } else {
          await router.push(to)
        }
        
        navigationRetries.value = 0
        return true
      } catch (error) {
        lastError = error
        console.error(`[Navigation] Attempt ${attempt + 1} failed:`, error)
        
        if (attempt < maxRetries) {
          navigationRetries.value = attempt + 1
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      } finally {
        isNavigating.value = false
      }
    }
    
    navigationError.value = lastError
    throw lastError
  }
  
  // Clear navigation error
  function clearNavigationError() {
    navigationError.value = null
    navigationRetries.value = 0
  }
  
  return {
    isNavigating: readonly(isNavigating),
    navigationError: readonly(navigationError),
    navigationRetries: readonly(navigationRetries),
    safeNavigate,
    clearNavigationError
  }
}