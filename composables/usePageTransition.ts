export const usePageTransition = () => {
  const transitionState = useState('page-transition-state', () => 'idle')
  const transitionError = useState('page-transition-error', () => null)
  
  const router = useRouter()
  const nuxtApp = useNuxtApp()
  
  // Hook into page transitions
  nuxtApp.hook('page:start', () => {
    console.log('[Page Transition] Page start')
    transitionState.value = 'starting'
  })
  
  nuxtApp.hook('page:finish', () => {
    console.log('[Page Transition] Page finish')
    transitionState.value = 'finished'
    // Reset to idle after a short delay
    setTimeout(() => {
      transitionState.value = 'idle'
    }, 100)
  })
  
  nuxtApp.hook('vue:error', (error) => {
    console.error('[Page Transition] Vue error:', error)
    transitionError.value = error
  })
  
  // Safe navigation with logging
  const safeNavigate = async (to: string) => {
    console.log('[Page Transition] Starting navigation to:', to)
    transitionState.value = 'navigating'
    transitionError.value = null
    
    try {
      await navigateTo(to)
      console.log('[Page Transition] Navigation completed')
      return true
    } catch (error) {
      console.error('[Page Transition] Navigation error:', error)
      transitionError.value = error
      transitionState.value = 'error'
      return false
    }
  }
  
  return {
    transitionState: readonly(transitionState),
    transitionError: readonly(transitionError),
    safeNavigate
  }
}