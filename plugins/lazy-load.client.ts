export default defineNuxtPlugin((nuxtApp) => {
  // Create intersection observer for lazy loading
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          const callback = (element as any)._lazyLoadCallback
          
          if (callback) {
            callback()
            observer.unobserve(element)
            delete (element as any)._lazyLoadCallback
          }
        }
      })
    },
    {
      rootMargin: '50px',
      threshold: 0.01
    }
  )

  // Vue directive for lazy loading components
  nuxtApp.vueApp.directive('lazy-load', {
    mounted(el, binding) {
      // Store the callback
      (el as any)._lazyLoadCallback = binding.value
      
      // Start observing
      observer.observe(el)
    },
    unmounted(el) {
      observer.unobserve(el)
      delete (el as any)._lazyLoadCallback
    }
  })

  // Cleanup on app unmount
  nuxtApp.hook('app:unmounted', () => {
    observer.disconnect()
  })
})