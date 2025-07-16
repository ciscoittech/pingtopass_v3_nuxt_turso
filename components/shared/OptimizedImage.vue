<template>
  <div class="optimized-image" :class="containerClass">
    <!-- Blur placeholder while loading -->
    <transition name="fade">
      <div
        v-if="!imageLoaded"
        class="image-placeholder"
        :style="placeholderStyle"
      />
    </transition>

    <!-- Actual image -->
    <img
      v-if="shouldLoad"
      :src="imageSrc"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="loading"
      :class="imageClass"
      :style="imageStyle"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- Error state -->
    <div v-if="imageError" class="image-error">
      <Icon icon="solar:image-broken" size="48" class="text-grey-lighten-1" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  aspectRatio?: string
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  imageClass?: string
  containerClass?: string
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  loading: 'lazy',
  fit: 'cover',
  threshold: 0
})

const { generateBlurDataURL, getOptimizedImageUrl } = useOptimizedImage()

// State
const imageLoaded = ref(false)
const imageError = ref(false)
const shouldLoad = ref(props.loading === 'eager')
const observer = ref<IntersectionObserver | null>(null)
const imageElement = ref<HTMLElement | null>(null)

// Computed
const imageSrc = computed(() => getOptimizedImageUrl(props.src, Number(props.width)))

const placeholderStyle = computed(() => ({
  backgroundImage: `url(${props.placeholder || generateBlurDataURL()})`,
  paddingTop: props.aspectRatio || (props.height && props.width ? `${(Number(props.height) / Number(props.width)) * 100}%` : undefined)
}))

const imageStyle = computed(() => ({
  objectFit: props.fit,
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

// Methods
const handleLoad = () => {
  imageLoaded.value = true
  imageError.value = false
}

const handleError = () => {
  imageError.value = true
  imageLoaded.value = false
}

const observeImage = () => {
  if (!process.client || props.loading !== 'lazy') return

  const options = {
    rootMargin: '50px',
    threshold: props.threshold
  }

  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        shouldLoad.value = true
        observer.value?.disconnect()
      }
    })
  }, options)

  nextTick(() => {
    const container = document.querySelector('.optimized-image')
    if (container) {
      observer.value.observe(container)
    }
  })
}

// Lifecycle
onMounted(() => {
  observeImage()
})

onUnmounted(() => {
  observer.value?.disconnect()
})
</script>

<style scoped>
.optimized-image {
  position: relative;
  overflow: hidden;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  filter: blur(20px);
  transform: scale(1.1);
}

.optimized-image img {
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  z-index: 1;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(var(--v-theme-surface), 0.05);
  border-radius: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>