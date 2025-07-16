<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="snackbarColor"
    location="top"
    rounded="lg"
    elevation="2"
    multi-line
  >
    <div class="d-flex align-center">
      <v-icon class="mr-3">{{ errorIcon }}</v-icon>
      <div class="flex-grow-1">
        <div class="font-weight-medium">{{ title }}</div>
        <div v-if="message" class="text-body-2">{{ message }}</div>
      </div>
    </div>
    
    <template v-slot:actions>
      <v-btn
        v-if="showRetry && onRetry"
        variant="text"
        size="small"
        @click="handleRetry"
      >
        Retry
      </v-btn>
      
      <v-btn
        icon
        variant="text"
        size="small"
        @click="close"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import type { AppError } from '~/composables/useErrorHandler'

interface Props {
  error?: AppError | null
  title?: string
  message?: string
  timeout?: number
  showRetry?: boolean
  onRetry?: () => void | Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  timeout: 6000,
  showRetry: false
})

const emit = defineEmits<{
  'close': []
}>()

// State
const show = ref(false)

// Computed
const snackbarColor = computed(() => {
  if (!props.error) return 'error'
  
  switch (props.error.severity) {
    case 'info':
      return 'info'
    case 'warning':
      return 'warning'
    case 'critical':
      return 'error'
    default:
      return 'error'
  }
})

const errorIcon = computed(() => {
  if (!props.error) return 'mdi-alert-circle'
  
  switch (props.error.severity) {
    case 'info':
      return 'mdi-information'
    case 'warning':
      return 'mdi-alert'
    case 'critical':
      return 'mdi-alert-octagon'
    default:
      return 'mdi-alert-circle'
  }
})

// Watch for error changes
watch(() => props.error, (newError) => {
  if (newError) {
    show.value = true
  }
}, { immediate: true })

// Methods
const close = () => {
  show.value = false
  emit('close')
}

const handleRetry = async () => {
  if (props.onRetry) {
    close()
    await props.onRetry()
  }
}

// Auto-close on unmount
onUnmounted(() => {
  show.value = false
})
</script>