// Utility functions for dynamic component imports with loading states

export const importWithLoading = async (
  importFn: () => Promise<any>,
  loadingCallback?: () => void,
  errorCallback?: (error: Error) => void
) => {
  try {
    if (loadingCallback) {
      loadingCallback()
    }
    const module = await importFn()
    return module.default || module
  } catch (error) {
    console.error('Dynamic import failed:', error)
    if (errorCallback) {
      errorCallback(error as Error)
    }
    throw error
  }
}

// Preload components on hover/focus for better perceived performance
export const preloadComponent = (importFn: () => Promise<any>) => {
  if (typeof window === 'undefined') return
  
  // Use requestIdleCallback if available
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      importFn()
    })
  } else {
    // Fallback to setTimeout
    setTimeout(() => {
      importFn()
    }, 1)
  }
}

// Create a lazy component with retry logic
export const createLazyComponent = (
  importFn: () => Promise<any>,
  maxRetries = 3,
  retryDelay = 1000
) => {
  let retries = 0
  
  const load = async (): Promise<any> => {
    try {
      return await importFn()
    } catch (error) {
      if (retries < maxRetries) {
        retries++
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return load()
      }
      throw error
    }
  }
  
  return defineAsyncComponent({
    loader: load,
    loadingComponent: {
      template: '<div class="d-flex justify-center align-center" style="min-height: 200px;"><v-progress-circular indeterminate /></div>'
    },
    errorComponent: {
      template: '<div class="text-center pa-4"><v-icon size="48" color="error">mdi-alert-circle</v-icon><p class="mt-2">Failed to load component</p></div>'
    },
    delay: 200,
    timeout: 30000
  })
}

// Batch preload multiple components
export const batchPreload = (importFns: Array<() => Promise<any>>) => {
  if (typeof window === 'undefined') return
  
  // Use requestIdleCallback for non-critical preloading
  if ('requestIdleCallback' in window) {
    importFns.forEach(importFn => {
      (window as any).requestIdleCallback(() => {
        importFn().catch(err => console.warn('Preload failed:', err))
      })
    })
  } else {
    // Fallback: preload after a delay
    setTimeout(() => {
      Promise.all(
        importFns.map(fn => fn().catch(err => console.warn('Preload failed:', err)))
      )
    }, 2000)
  }
}