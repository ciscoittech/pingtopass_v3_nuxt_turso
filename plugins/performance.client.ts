export default defineNuxtPlugin(() => {
  if (process.dev) {
    // Track component render times in development
    const componentTimes = new Map<string, number[]>()
    
    // Monitor route changes
    const router = useRouter()
    let routeStartTime = 0
    
    router.beforeEach(() => {
      routeStartTime = performance.now()
    })
    
    router.afterEach((to) => {
      const routeEndTime = performance.now()
      const routeDuration = routeEndTime - routeStartTime
      
      if (routeDuration > 100) {
        console.warn(`[Performance] Route ${to.path} took ${routeDuration.toFixed(2)}ms`)
      }
    })
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[Performance] Long task detected:', {
              duration: entry.duration.toFixed(2) + 'ms',
              startTime: entry.startTime.toFixed(2) + 'ms'
            })
          }
        }
      })
      
      observer.observe({ entryTypes: ['longtask'] })
    }
    
    // Expose performance utilities
    return {
      provide: {
        performance: {
          mark: (name: string) => {
            performance.mark(name)
          },
          
          measure: (name: string, startMark: string, endMark?: string) => {
            try {
              performance.measure(name, startMark, endMark)
              const measure = performance.getEntriesByName(name, 'measure')[0]
              
              if (measure && measure.duration > 16) {
                console.warn(`[Performance] ${name} took ${measure.duration.toFixed(2)}ms`)
              }
              
              return measure?.duration || 0
            } catch (error) {
              console.error('[Performance] Measurement error:', error)
              return 0
            }
          },
          
          trackComponent: (componentName: string, duration: number) => {
            if (!componentTimes.has(componentName)) {
              componentTimes.set(componentName, [])
            }
            
            const times = componentTimes.get(componentName)!
            times.push(duration)
            
            // Keep only last 100 measurements
            if (times.length > 100) {
              times.shift()
            }
            
            // Log if average is high
            const avg = times.reduce((a, b) => a + b, 0) / times.length
            if (avg > 16 && times.length > 10) {
              console.warn(`[Performance] ${componentName} avg render time: ${avg.toFixed(2)}ms`)
            }
          }
        }
      }
    }
  }
  
  // Production: Return no-op functions
  return {
    provide: {
      performance: {
        mark: () => {},
        measure: () => 0,
        trackComponent: () => {}
      }
    }
  }
})