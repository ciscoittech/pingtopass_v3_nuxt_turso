// Utility for adding resource hints to optimize loading

export interface ResourceHint {
  href: string
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch'
  type?: string
  crossorigin?: boolean | string
}

// Add prefetch hint for resources that might be needed soon
export const prefetchResource = (hint: ResourceHint) => {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = hint.href
  
  if (hint.as) link.as = hint.as
  if (hint.type) link.type = hint.type
  if (hint.crossorigin) {
    link.crossOrigin = typeof hint.crossorigin === 'string' ? hint.crossorigin : 'anonymous'
  }
  
  document.head.appendChild(link)
}

// Add preload hint for critical resources
export const preloadResource = (hint: ResourceHint) => {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = hint.href
  
  if (hint.as) link.as = hint.as
  if (hint.type) link.type = hint.type
  if (hint.crossorigin) {
    link.crossOrigin = typeof hint.crossorigin === 'string' ? hint.crossorigin : 'anonymous'
  }
  
  document.head.appendChild(link)
}

// Preconnect to external domains
export const preconnectDomain = (origin: string, crossorigin = false) => {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = origin
  
  if (crossorigin) {
    link.crossOrigin = 'anonymous'
  }
  
  document.head.appendChild(link)
}

// DNS prefetch for domains
export const dnsPrefetch = (hostname: string) => {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = `//${hostname}`
  
  document.head.appendChild(link)
}

// Batch add multiple hints
export const addResourceHints = (hints: Array<{
  type: 'prefetch' | 'preload' | 'preconnect' | 'dns-prefetch'
  url: string
  options?: Partial<ResourceHint>
}>) => {
  if (typeof window === 'undefined') return
  
  hints.forEach(hint => {
    switch (hint.type) {
      case 'prefetch':
        prefetchResource({ href: hint.url, ...hint.options })
        break
      case 'preload':
        preloadResource({ href: hint.url, ...hint.options })
        break
      case 'preconnect':
        preconnectDomain(hint.url, hint.options?.crossorigin as boolean)
        break
      case 'dns-prefetch':
        dnsPrefetch(hint.url)
        break
    }
  })
}

// Smart prefetching based on user interaction
export const setupSmartPrefetch = () => {
  if (typeof window === 'undefined') return
  
  // Prefetch on link hover
  const links = document.querySelectorAll('a[href^="/"]')
  const prefetchedUrls = new Set<string>()
  
  links.forEach(link => {
    let timeoutId: NodeJS.Timeout
    
    link.addEventListener('mouseenter', () => {
      const href = link.getAttribute('href')
      if (href && !prefetchedUrls.has(href)) {
        timeoutId = setTimeout(() => {
          prefetchResource({ href, as: 'fetch' })
          prefetchedUrls.add(href)
        }, 100) // Small delay to avoid prefetching on accidental hovers
      }
    })
    
    link.addEventListener('mouseleave', () => {
      if (timeoutId) clearTimeout(timeoutId)
    })
  })
}