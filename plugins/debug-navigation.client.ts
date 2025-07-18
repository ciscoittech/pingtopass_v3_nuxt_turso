export default defineNuxtPlugin((nuxtApp) => {
  console.log('[Debug Plugin] Navigation debug plugin loaded')
  
  // Track all route changes
  nuxtApp.hook('app:mounted', () => {
    console.log('[Debug Plugin] App mounted')
  })
  
  nuxtApp.hook('page:start', () => {
    console.log('[Debug Plugin] Page start hook triggered')
  })
  
  nuxtApp.hook('page:finish', () => {
    console.log('[Debug Plugin] Page finish hook triggered')
  })
  
  // Vue Router hooks
  const router = useRouter()
  
  router.beforeEach((to, from, next) => {
    console.log('[Debug Router] beforeEach:', {
      from: from.fullPath,
      to: to.fullPath,
      params: to.params,
      query: to.query
    })
    next()
  })
  
  router.afterEach((to, from) => {
    console.log('[Debug Router] afterEach:', {
      from: from.fullPath,
      to: to.fullPath,
      success: true
    })
  })
  
  router.onError((error) => {
    console.error('[Debug Router] Navigation error:', error)
  })
  
  // Track component mounting
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('[Debug Vue] Error:', error)
    console.error('[Debug Vue] Component:', instance?.$options.name || 'Unknown')
    console.error('[Debug Vue] Error Info:', info)
  }
  
  // Track async data errors
  nuxtApp.hook('vue:error', (error, instance, info) => {
    console.error('[Debug Hook] Vue error:', error)
    console.error('[Debug Hook] Instance:', instance)
    console.error('[Debug Hook] Info:', info)
  })
})