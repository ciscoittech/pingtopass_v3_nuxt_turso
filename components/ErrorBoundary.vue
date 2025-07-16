<template>
  <div v-if="error" class="error-boundary">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-card elevation="0" rounded="lg" class="error-card">
            <v-card-text class="text-center pa-8">
              <!-- Error Icon -->
              <v-avatar
                :color="iconColor"
                size="80"
                class="mb-4"
              >
                <v-icon size="40">{{ errorIcon }}</v-icon>
              </v-avatar>
              
              <!-- Error Message -->
              <h2 class="text-h5 font-weight-bold mb-2">
                {{ errorTitle }}
              </h2>
              
              <p class="text-body-1 text-medium-emphasis mb-6">
                {{ errorMessage }}
              </p>
              
              <!-- Actions -->
              <div class="d-flex gap-3 justify-center flex-wrap">
                <v-btn
                  v-if="showRetry"
                  color="primary"
                  variant="flat"
                  @click="retry"
                  :loading="retrying"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Try Again
                </v-btn>
                
                <v-btn
                  v-if="showDashboard"
                  variant="outlined"
                  @click="goToDashboard"
                >
                  <v-icon start>mdi-home</v-icon>
                  Go to Dashboard
                </v-btn>
                
                <v-btn
                  v-if="showRefresh"
                  variant="outlined"
                  @click="refreshPage"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Refresh Page
                </v-btn>
              </div>
              
              <!-- Technical Details (Dev Mode) -->
              <v-expand-transition>
                <div v-if="showDetails && error.details" class="mt-6">
                  <v-divider class="mb-4" />
                  <v-alert
                    type="error"
                    variant="tonal"
                    density="compact"
                    class="text-left"
                  >
                    <div class="text-caption">
                      <strong>Error Code:</strong> {{ error.code }}<br>
                      <strong>Context:</strong> {{ error.context || 'Unknown' }}<br>
                      <strong>Timestamp:</strong> {{ new Date(error.timestamp).toLocaleString() }}
                    </div>
                    <details class="mt-2">
                      <summary class="cursor-pointer">Technical Details</summary>
                      <pre class="text-caption mt-2">{{ JSON.stringify(error.details, null, 2) }}</pre>
                    </details>
                  </v-alert>
                </div>
              </v-expand-transition>
              
              <!-- Toggle Details Button (Dev Mode) -->
              <v-btn
                v-if="isDev"
                variant="text"
                size="small"
                class="mt-4"
                @click="showDetails = !showDetails"
              >
                {{ showDetails ? 'Hide' : 'Show' }} Details
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
  
  <!-- Child content when no error -->
  <slot v-else />
</template>

<script setup lang="ts">
import type { AppError } from '~/composables/useErrorHandler'

interface Props {
  error?: AppError | null
  onRetry?: () => void | Promise<void>
  showRetryButton?: boolean
  showDashboardButton?: boolean
  showRefreshButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRetryButton: true,
  showDashboardButton: true,
  showRefreshButton: false
})

const emit = defineEmits<{
  'clear-error': []
}>()

const router = useRouter()
const { ERROR_CODES } = useErrorHandler()

// State
const retrying = ref(false)
const showDetails = ref(false)

// Computed
const isDev = computed(() => process.dev)

const errorTitle = computed(() => {
  if (!props.error) return 'Something went wrong'
  
  switch (props.error.severity) {
    case 'critical':
      return 'Critical Error'
    case 'warning':
      return 'Warning'
    case 'info':
      return 'Information'
    default:
      return 'Error Occurred'
  }
})

const errorMessage = computed(() => {
  return props.error?.message || 'An unexpected error occurred. Please try again.'
})

const errorIcon = computed(() => {
  if (!props.error) return 'mdi-alert-circle'
  
  switch (props.error.severity) {
    case 'critical':
      return 'mdi-alert-octagon'
    case 'warning':
      return 'mdi-alert'
    case 'info':
      return 'mdi-information'
    default:
      return 'mdi-alert-circle'
  }
})

const iconColor = computed(() => {
  if (!props.error) return 'error'
  
  switch (props.error.severity) {
    case 'critical':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'error'
  }
})

const showRetry = computed(() => {
  if (!props.showRetryButton || !props.error) return false
  
  // Show retry for recoverable errors
  return [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
    ERROR_CODES.SESSION_SAVE_FAILED,
    ERROR_CODES.QUESTION_LOAD_FAILED
  ].includes(props.error.code)
})

const showDashboard = computed(() => {
  return props.showDashboardButton
})

const showRefresh = computed(() => {
  if (!props.error) return false
  
  // Show refresh for critical errors
  return props.error.severity === 'critical' || props.showRefreshButton
})

// Methods
const retry = async () => {
  if (props.onRetry) {
    retrying.value = true
    try {
      await props.onRetry()
      emit('clear-error')
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      retrying.value = false
    }
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
  emit('clear-error')
}

const refreshPage = () => {
  window.location.reload()
}
</script>

<style lang="scss" scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-error), 0.05) 100%);
}

.cursor-pointer {
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}
</style>