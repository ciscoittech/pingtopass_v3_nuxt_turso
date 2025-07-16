# 🚀 Performance Optimization Guide

## Overview

This document outlines the performance optimizations implemented in the PingToPass Nuxt application to ensure fast load times and smooth user experience.

## Table of Contents

1. [Build Optimizations](#build-optimizations)
2. [Code Splitting](#code-splitting)
3. [Image Optimization](#image-optimization)
4. [Lazy Loading](#lazy-loading)
5. [Resource Hints](#resource-hints)
6. [Performance Monitoring](#performance-monitoring)
7. [Best Practices](#best-practices)

## Build Optimizations

### Vite Configuration

The `nuxt.config.ts` includes several Vite optimizations:

```typescript
vite: {
  build: {
    // Minification with tree-shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // Remove console logs in production
        drop_debugger: true,   // Remove debugger statements
      },
    },
    // Manual chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vuetify': ['vuetify'],
          'charts': ['apexcharts', 'vue3-apexcharts'],
          'icons': ['@iconify/vue'],
          'utils': ['dayjs', 'lodash-es'],
        },
      },
    },
  },
}
```

### Benefits
- **Reduced bundle size**: Terser removes dead code and minifies JavaScript
- **Better caching**: Separate chunks for vendor libraries
- **Faster updates**: Only changed chunks need to be downloaded

## Code Splitting

### Dynamic Imports

Use dynamic imports for heavy components:

```typescript
// utils/dynamic-imports.ts
export const createLazyComponent = (
  importFn: () => Promise<any>,
  maxRetries = 3
) => {
  return defineAsyncComponent({
    loader: importFn,
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    delay: 200,
    timeout: 30000
  })
}
```

### Route-based Splitting

Nuxt automatically splits code by route. Additional optimizations:

```typescript
// Preload critical routes
export const preloadRoute = (route: string) => {
  if (typeof window !== 'undefined') {
    router.prefetch(route)
  }
}
```

## Image Optimization

### OptimizedImage Component

The `OptimizedImage.vue` component provides:

1. **Lazy loading**: Images load when entering viewport
2. **Blur placeholders**: Better perceived performance
3. **Responsive sizing**: Appropriate image sizes for devices

```vue
<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  :width="800"
  :height="600"
  loading="lazy"
  :placeholder="blurDataUrl"
/>
```

### useOptimizedImage Composable

```typescript
// composables/useOptimizedImage.ts
const { generateBlurDataURL, getOptimizedImageUrl } = useOptimizedImage()

// Generate blur placeholder
const placeholder = generateBlurDataURL(10, 10)

// Get optimized URL with proper sizing
const imageUrl = getOptimizedImageUrl(originalUrl, width)
```

## Lazy Loading

### Component Lazy Loading

```vue
<!-- LazyApexChart.vue example -->
<template>
  <ClientOnly>
    <component
      v-if="chartComponent"
      :is="chartComponent"
      v-bind="$attrs"
    />
  </ClientOnly>
</template>

<script setup>
// Load chart only when visible
const loadChart = async () => {
  chartComponent.value = await import('vue3-apexcharts')
}
</script>
```

### Directive for Lazy Loading

```typescript
// plugins/lazy-load.client.ts
app.directive('lazy-load', {
  mounted(el, binding) {
    observer.observe(el)
  }
})
```

Usage:
```vue
<div v-lazy-load="loadHeavyComponent">
  <!-- Content loads when visible -->
</div>
```

## Resource Hints

### Prefetching and Preloading

```typescript
// utils/resource-hints.ts

// Prefetch resources for future navigation
prefetchResource({
  href: '/js/heavy-feature.js',
  as: 'script'
})

// Preload critical resources
preloadResource({
  href: '/fonts/main.woff2',
  as: 'font',
  type: 'font/woff2',
  crossorigin: true
})

// Preconnect to external domains
preconnectDomain('https://fonts.googleapis.com')
```

### Smart Prefetching

Automatically prefetch links on hover:

```typescript
setupSmartPrefetch() // Prefetches internal links on hover
```

## Performance Monitoring

### Web Vitals Tracking

The `plugins/performance.client.ts` monitors:

- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)

```typescript
// Automatic monitoring in production
export default defineNuxtPlugin((nuxtApp) => {
  // Monitors Web Vitals and logs to console
  // Can be extended to send to analytics
})
```

### Route Performance

Track navigation performance:

```typescript
nuxtApp.hook('page:finish', () => {
  const duration = performance.now() - routeStartTime
  console.log('Route change:', duration.toFixed(2), 'ms')
})
```

## Best Practices

### 1. Use Skeleton Loaders

Replace loading spinners with skeleton screens:

```vue
<ExamCardSkeleton v-if="loading" />
<ExamCard v-else :exam="exam" />
```

### 2. Optimize Bundle Size

- Use tree-shakeable imports
- Remove unused dependencies
- Analyze bundle with `npx nuxi analyze`

### 3. Implement Virtual Scrolling

For long lists, use virtual scrolling:

```vue
<v-virtual-scroll
  :items="exams"
  :item-height="120"
  height="600"
>
  <template #default="{ item }">
    <ExamCard :exam="item" />
  </template>
</v-virtual-scroll>
```

### 4. Cache API Responses

Use Nuxt's built-in caching:

```typescript
const { data } = await useFetch('/api/exams', {
  key: 'exams-list',
  cache: 'default',
  getCachedData(key) {
    const cached = nuxtApp.payload.data[key]
    if (cached && Date.now() - cached.fetchedAt < 300000) {
      return cached
    }
  }
})
```

### 5. Optimize Third-party Scripts

Load third-party scripts efficiently:

```typescript
useHead({
  script: [{
    src: 'https://analytics.example.com/script.js',
    async: true,
    defer: true,
  }]
})
```

## Performance Checklist

- [ ] Enable production build optimizations
- [ ] Implement code splitting for large components
- [ ] Use lazy loading for below-fold content
- [ ] Add appropriate resource hints
- [ ] Monitor Web Vitals in production
- [ ] Optimize images with proper sizing
- [ ] Use skeleton loaders for better UX
- [ ] Implement virtual scrolling for long lists
- [ ] Cache API responses appropriately
- [ ] Minimize third-party script impact

## Measuring Performance

### Development

```bash
# Analyze bundle size
npm run analyze

# Test with production build
npm run build && npm run preview
```

### Tools

1. **Chrome DevTools**: Performance tab and Lighthouse
2. **WebPageTest**: Real-world performance testing
3. **Bundle Analyzer**: Identify large dependencies
4. **Coverage Tab**: Find unused code

## Troubleshooting

### Large Bundle Size

1. Check bundle analyzer output
2. Look for duplicate dependencies
3. Consider dynamic imports
4. Remove unused code

### Slow Initial Load

1. Check network waterfall
2. Optimize critical rendering path
3. Implement proper caching
4. Use CDN for static assets

### Poor Runtime Performance

1. Profile with DevTools
2. Check for memory leaks
3. Optimize re-renders
4. Use computed properties effectively