<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

interface PerformanceMessage {
  id: string
  type: 'celebration' | 'encouragement' | 'motivation' | 'milestone' | 'achievement' | 'recognition' | 'insight'
  icon: string
  title: string
  message: string
  color: string
  priority: string
}

interface PerformanceTip {
  id: string
  icon: string
  title: string
  message: string
}

// Props
const props = defineProps<{
  dense?: boolean
}>()

// State
const loading = ref(true)
const messages = ref<PerformanceMessage[]>([])
const tips = ref<PerformanceTip[]>([])
const currentMessageIndex = ref(0)
const showAllMessages = ref(false)
const motivationalQuote = ref('')
const animationKey = ref(0)

// Performance data
const performance = ref<any>(null)

// Computed
const currentMessage = computed(() => messages.value[currentMessageIndex.value])
const hasMessages = computed(() => messages.value.length > 0)

// Fetch performance insights
const fetchInsights = async () => {
  loading.value = true
  try {
    const { data } = await $fetch('/api/insights/performance')
    
    if (data) {
      messages.value = data.messages
      tips.value = data.tips
      performance.value = data.performance
      motivationalQuote.value = data.summary.motivationalQuote
      
      // Start message rotation if multiple messages
      if (messages.value.length > 1) {
        startMessageRotation()
      }
    }
  } catch (error) {
    console.error('Failed to fetch performance insights:', error)
  } finally {
    loading.value = false
  }
}

// Message rotation
let rotationInterval: NodeJS.Timeout | null = null

const startMessageRotation = () => {
  if (rotationInterval) clearInterval(rotationInterval)
  
  rotationInterval = setInterval(() => {
    if (!showAllMessages.value && messages.value.length > 1) {
      nextMessage()
    }
  }, 6000) // Rotate every 6 seconds
}

const nextMessage = () => {
  currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.value.length
  animationKey.value++ // Trigger animation
}

const previousMessage = () => {
  currentMessageIndex.value = currentMessageIndex.value === 0 
    ? messages.value.length - 1 
    : currentMessageIndex.value - 1
  animationKey.value++
}

// Get message animation class
const getMessageAnimation = (type: string) => {
  const animations = {
    celebration: 'bounce-in',
    milestone: 'slide-up',
    achievement: 'zoom-in',
    default: 'fade-in'
  }
  return animations[type as keyof typeof animations] || animations.default
}

// Format numbers
const formatNumber = (num: number) => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

// Get performance indicator
const getPerformanceIndicator = () => {
  if (!performance.value) return { icon: '', color: '', label: '' }
  
  const accuracy = performance.value.overall.accuracy
  if (accuracy >= 90) {
    return { 
      icon: 'solar:star-shine-bold', 
      color: 'success', 
      label: 'Excellent' 
    }
  } else if (accuracy >= 80) {
    return { 
      icon: 'solar:star-bold', 
      color: 'primary', 
      label: 'Good' 
    }
  } else if (accuracy >= 70) {
    return { 
      icon: 'solar:star-line-duotone', 
      color: 'warning', 
      label: 'Fair' 
    }
  } else {
    return { 
      icon: 'solar:star-outline', 
      color: 'grey', 
      label: 'Needs Work' 
    }
  }
}

onMounted(() => {
  fetchInsights()
})

onUnmounted(() => {
  if (rotationInterval) clearInterval(rotationInterval)
})
</script>

<template>
  <v-card 
    :elevation="2"
    :class="{ 'pa-3': dense }"
    class="performance-messages-card"
  >
    <!-- Header -->
    <v-card-title class="d-flex align-center justify-space-between pa-3">
      <div class="d-flex align-center">
        <Icon icon="solar:chart-2-bold-duotone" size="24" class="mr-2 text-info" />
        <span class="text-h6">Performance Insights</span>
      </div>
      
      <!-- Performance Indicator -->
      <div v-if="performance && !loading" class="d-flex align-center">
        <v-chip
          :color="getPerformanceIndicator().color"
          variant="tonal"
          size="small"
        >
          <Icon :icon="getPerformanceIndicator().icon" size="16" class="mr-1" />
          {{ getPerformanceIndicator().label }}
        </v-chip>
      </div>
    </v-card-title>
    
    <v-card-text class="pa-3 pt-0">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate size="40" />
      </div>
      
      <template v-else>
        <!-- Performance Messages -->
        <div v-if="hasMessages" class="messages-section mb-4">
          <!-- Single Message View -->
          <div v-if="!showAllMessages && currentMessage" :key="animationKey">
            <v-alert
              :color="currentMessage.color"
              variant="tonal"
              density="comfortable"
              class="performance-alert"
              :class="getMessageAnimation(currentMessage.type)"
            >
              <template v-slot:prepend>
                <Icon :icon="currentMessage.icon" size="24" />
              </template>
              
              <div>
                <div class="font-weight-bold mb-1">{{ currentMessage.title }}</div>
                <div class="text-body-2">{{ currentMessage.message }}</div>
              </div>
              
              <!-- Navigation for multiple messages -->
              <template v-if="messages.length > 1" v-slot:append>
                <div class="d-flex align-center">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="previousMessage"
                  >
                    <Icon icon="solar:arrow-left-linear" size="16" />
                  </v-btn>
                  <span class="text-caption mx-2">
                    {{ currentMessageIndex + 1 }}/{{ messages.length }}
                  </span>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="nextMessage"
                  >
                    <Icon icon="solar:arrow-right-linear" size="16" />
                  </v-btn>
                </div>
              </template>
            </v-alert>
          </div>
          
          <!-- All Messages View -->
          <div v-else-if="showAllMessages" class="all-messages">
            <v-alert
              v-for="(msg, index) in messages"
              :key="msg.id"
              :color="msg.color"
              variant="tonal"
              density="compact"
              class="mb-2"
            >
              <template v-slot:prepend>
                <Icon :icon="msg.icon" size="20" />
              </template>
              <div>
                <span class="font-weight-medium">{{ msg.title }}</span>
                <span class="text-caption d-block">{{ msg.message }}</span>
              </div>
            </v-alert>
          </div>
          
          <!-- Toggle View Button -->
          <div v-if="messages.length > 1" class="text-center mt-2">
            <v-btn
              variant="text"
              size="x-small"
              @click="showAllMessages = !showAllMessages"
            >
              {{ showAllMessages ? 'Show less' : 'Show all' }}
              <Icon 
                :icon="showAllMessages ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'" 
                class="ml-1" 
                size="12"
              />
            </v-btn>
          </div>
        </div>
        
        <!-- Quick Stats -->
        <div v-if="performance && !dense" class="quick-stats mb-4">
          <v-row dense>
            <v-col cols="3" class="text-center">
              <div class="stat-value text-h6 font-weight-bold" :class="performance.overall.accuracy >= 80 ? 'text-success' : 'text-warning'">
                {{ Math.round(performance.overall.accuracy) }}%
              </div>
              <div class="stat-label text-caption text-grey">Accuracy</div>
            </v-col>
            <v-col cols="3" class="text-center">
              <div class="stat-value text-h6 font-weight-bold text-orange">
                <Icon icon="solar:flame-bold" size="16" class="mb-1" />
                {{ performance.recent.streakDays }}
              </div>
              <div class="stat-label text-caption text-grey">Day Streak</div>
            </v-col>
            <v-col cols="3" class="text-center">
              <div class="stat-value text-h6 font-weight-bold text-primary">
                {{ formatNumber(performance.overall.questionsAnswered) }}
              </div>
              <div class="stat-label text-caption text-grey">Questions</div>
            </v-col>
            <v-col cols="3" class="text-center">
              <div class="stat-value text-h6 font-weight-bold text-purple">
                +{{ performance.overall.improvement }}%
              </div>
              <div class="stat-label text-caption text-grey">Improved</div>
            </v-col>
          </v-row>
        </div>
        
        <!-- Performance Tips -->
        <div v-if="tips.length > 0" class="tips-section mb-3">
          <h4 class="text-subtitle-2 mb-2">
            <Icon icon="solar:lightbulb-bolt-bold-duotone" size="18" class="mr-1" />
            Personalized Tips
          </h4>
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="tip in tips"
              :key="tip.id"
              class="px-0 py-1"
            >
              <template v-slot:prepend>
                <Icon :icon="tip.icon" size="20" class="text-warning" />
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">
                {{ tip.title }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ tip.message }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>
        
        <!-- Motivational Quote -->
        <v-divider v-if="motivationalQuote" class="my-3" />
        <div v-if="motivationalQuote" class="quote-section text-center">
          <Icon icon="solar:quote-up-bold-duotone" size="20" class="text-grey mb-1" />
          <p class="text-body-2 text-italic text-grey100 mb-0">
            "{{ motivationalQuote }}"
          </p>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.performance-messages-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Message Animations */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zoomIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.bounce-in {
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.slide-up {
  animation: slideUp 0.5s ease-out;
}

.zoom-in {
  animation: zoomIn 0.4s ease-out;
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}

/* Performance Alert Styling */
.performance-alert {
  border-left: 4px solid currentColor;
  position: relative;
  overflow: hidden;
}

.performance-alert::after {
  content: '';
  position: absolute;
  top: 0;
  right: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    right: -100%;
  }
  100% {
    right: 100%;
  }
}

/* Quick Stats */
.quick-stats {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 12px;
}

.stat-value {
  line-height: 1.2;
}

.stat-label {
  margin-top: 2px;
}

/* Tips Section */
.tips-section {
  background: rgba(var(--v-theme-warning), 0.05);
  border-radius: 8px;
  padding: 12px;
}

/* Quote Section */
.quote-section {
  position: relative;
  padding: 8px 16px;
}

.quote-section::before,
.quote-section::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 20%;
  height: 1px;
  background: rgba(var(--v-theme-on-surface), 0.12);
}

.quote-section::before {
  left: 0;
}

.quote-section::after {
  right: 0;
}

/* Mobile Adjustments */
@media (max-width: 600px) {
  .performance-alert {
    font-size: 0.875rem;
  }
  
  .stat-value {
    font-size: 1rem !important;
  }
  
  .quote-section {
    font-size: 0.8125rem;
  }
}
</style>