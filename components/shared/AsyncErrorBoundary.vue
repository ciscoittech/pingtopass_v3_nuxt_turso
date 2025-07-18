<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending && !data" class="async-loading">
      <slot name="loading">
        <div class="text-center py-12">
          <v-progress-circular 
            indeterminate 
            :color="loadingColor" 
            :size="loadingSize"
          />
          <p v-if="loadingText" class="mt-4 text-subtitle-1">{{ loadingText }}</p>
        </div>
      </slot>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !pending" class="async-error">
      <slot name="error" :error="error" :retry="retry">
        <div class="text-center py-12">
          <v-icon :size="errorIconSize" color="error" class="mb-4">
            {{ errorIcon }}
          </v-icon>
          <h3 class="text-h5 mb-2">{{ errorTitle }}</h3>
          <p class="text-body-1 text-medium-emphasis mb-4">
            {{ errorMessage || error.message || 'An unexpected error occurred' }}
          </p>
          <v-btn 
            v-if="showRetry" 
            color="primary" 
            variant="flat" 
            @click="retry"
          >
            {{ retryText }}
          </v-btn>
          <v-btn 
            v-if="backUrl" 
            :to="backUrl"
            variant="text"
            class="ml-2"
          >
            {{ backText }}
          </v-btn>
        </div>
      </slot>
    </div>

    <!-- Success State -->
    <div v-else-if="data || (!pending && !error)" class="async-content">
      <slot :data="data" />
    </div>

    <!-- Empty State (optional) -->
    <div v-else-if="!pending && !error && isEmpty" class="async-empty">
      <slot name="empty">
        <div class="text-center py-12">
          <v-icon size="64" color="grey" class="mb-4">
            {{ emptyIcon }}
          </v-icon>
          <h3 class="text-h5 mb-2">{{ emptyTitle }}</h3>
          <p class="text-body-1 text-medium-emphasis">
            {{ emptyMessage }}
          </p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  pending: boolean
  error: any
  data: any
  isEmpty?: boolean
  // Loading props
  loadingText?: string
  loadingColor?: string
  loadingSize?: number
  // Error props
  errorTitle?: string
  errorMessage?: string
  errorIcon?: string
  errorIconSize?: number
  showRetry?: boolean
  retryText?: string
  onRetry?: () => void | Promise<void>
  backUrl?: string
  backText?: string
  // Empty props
  emptyTitle?: string
  emptyMessage?: string
  emptyIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  isEmpty: false,
  // Loading defaults
  loadingText: '',
  loadingColor: 'primary',
  loadingSize: 64,
  // Error defaults
  errorTitle: 'Unable to Load',
  errorMessage: '',
  errorIcon: 'mdi-alert-circle',
  errorIconSize: 64,
  showRetry: true,
  retryText: 'Try Again',
  backText: 'Go Back',
  // Empty defaults
  emptyTitle: 'No Data Found',
  emptyMessage: 'There is no data to display',
  emptyIcon: 'mdi-inbox'
})

const emit = defineEmits<{
  retry: []
}>()

const retry = async () => {
  if (props.onRetry) {
    await props.onRetry()
  }
  emit('retry')
}
</script>

<style scoped>
.async-loading,
.async-error,
.async-content,
.async-empty {
  min-height: 200px;
  transition: opacity 0.3s ease;
}

.async-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>