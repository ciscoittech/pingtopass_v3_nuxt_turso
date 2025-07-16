export const useOptimizedImage = () => {
  const isClient = process.client

  // Generate blur placeholder data URL
  const generateBlurDataURL = (width = 10, height = 10) => {
    return `data:image/svg+xml,%3Csvg width='${width}' height='${height}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3C/svg%3E`
  }

  // Check if image is in viewport
  const isInViewport = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  // Preload critical images
  const preloadImage = (src: string) => {
    if (!isClient) return
    
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  }

  // Get optimized image URL based on screen size
  const getOptimizedImageUrl = (src: string, width?: number) => {
    if (!src) return ''
    
    // If it's already a data URL or external URL, return as is
    if (src.startsWith('data:') || src.startsWith('http')) {
      return src
    }

    // For local images, you could implement a CDN or image optimization service
    // For now, return the original source
    return src
  }

  // Image loading states
  const createImageLoader = () => {
    const loading = ref(true)
    const error = ref(false)
    const loaded = ref(false)

    const onLoad = () => {
      loading.value = false
      loaded.value = true
    }

    const onError = () => {
      loading.value = false
      error.value = true
    }

    return {
      loading: readonly(loading),
      error: readonly(error),
      loaded: readonly(loaded),
      onLoad,
      onError
    }
  }

  return {
    generateBlurDataURL,
    isInViewport,
    preloadImage,
    getOptimizedImageUrl,
    createImageLoader
  }
}