<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Icon } from '@iconify/vue'

interface TutorialStep {
  id: string
  title: string
  description: string
  target: string // CSS selector for element to highlight
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'complete': []
}>()

// Tutorial steps configuration
const steps: TutorialStep[] = [
  {
    id: 'chat-assistant',
    title: 'Meet Your AI Study Assistant! 🤖',
    description: 'Click here anytime to get help with your studies, ask questions, or get exam tips.',
    target: '.chat-fab',
    position: 'top'
  },
  {
    id: 'continue-study',
    title: 'Continue Where You Left Off 📚',
    description: 'Your most recent study session appears here. One click to resume!',
    target: '.continue-study-card',
    position: 'bottom'
  },
  {
    id: 'quick-actions',
    title: 'Quick Access to Exams 🚀',
    description: 'Jump straight into studying with your most popular exams.',
    target: '.quick-actions-card',
    position: 'top'
  },
  {
    id: 'progress-tracking',
    title: 'Track Your Progress 📊',
    description: 'See your streak, accuracy, and study time at a glance.',
    target: '.welcome-card',
    position: 'right'
  }
]

// State
const currentStepIndex = ref(0)
const highlightPosition = ref({ top: 0, left: 0, width: 0, height: 0 })
const tooltipPosition = ref({ top: 0, left: 0 })
const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Current step
const currentStep = computed(() => steps[currentStepIndex.value])

// Progress
const progress = computed(() => ((currentStepIndex.value + 1) / steps.length) * 100)

// Position spotlight and tooltip
const positionElements = () => {
  if (!currentStep.value) return
  
  const target = document.querySelector(currentStep.value.target)
  if (!target) {
    console.warn(`Tutorial target not found: ${currentStep.value.target}`)
    return
  }
  
  const rect = target.getBoundingClientRect()
  const padding = 8
  
  // Position highlight
  highlightPosition.value = {
    top: rect.top - padding + window.scrollY,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  }
  
  // Position tooltip
  const tooltipWidth = 320
  const tooltipHeight = 150 // Approximate
  const spacing = 20
  
  switch (currentStep.value.position) {
    case 'top':
      tooltipPosition.value = {
        top: rect.top - tooltipHeight - spacing + window.scrollY,
        left: rect.left + rect.width / 2 - tooltipWidth / 2
      }
      break
    case 'bottom':
      tooltipPosition.value = {
        top: rect.bottom + spacing + window.scrollY,
        left: rect.left + rect.width / 2 - tooltipWidth / 2
      }
      break
    case 'left':
      tooltipPosition.value = {
        top: rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY,
        left: rect.left - tooltipWidth - spacing
      }
      break
    case 'right':
      tooltipPosition.value = {
        top: rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY,
        left: rect.right + spacing
      }
      break
  }
  
  // Ensure tooltip stays within viewport
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  if (tooltipPosition.value.left < 10) {
    tooltipPosition.value.left = 10
  } else if (tooltipPosition.value.left + tooltipWidth > viewportWidth - 10) {
    tooltipPosition.value.left = viewportWidth - tooltipWidth - 10
  }
  
  if (tooltipPosition.value.top < 10) {
    tooltipPosition.value.top = 10
  }
}

// Navigation
const nextStep = () => {
  if (currentStepIndex.value < steps.length - 1) {
    currentStepIndex.value++
    positionElements()
  } else {
    completeTutorial()
  }
}

const previousStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
    positionElements()
  }
}

const skipTutorial = () => {
  isVisible.value = false
  localStorage.setItem('tutorialCompleted', 'true')
  // Clean up any animations
  const chatFab = document.querySelector('.chat-fab')
  if (chatFab) {
    chatFab.classList.remove('tutorial-pulse')
  }
}

const completeTutorial = () => {
  isVisible.value = false
  localStorage.setItem('tutorialCompleted', 'true')
  emit('complete')
  // Clean up any animations
  const chatFab = document.querySelector('.chat-fab')
  if (chatFab) {
    chatFab.classList.remove('tutorial-pulse')
  }
}

// Handle step actions (like pulsing the chat button)
const handleStepAction = () => {
  if (currentStep.value.action) {
    currentStep.value.action()
  }
  
  // Add pulse animation to chat FAB when on chat step
  if (currentStep.value.id === 'chat-assistant') {
    const chatFab = document.querySelector('.chat-fab')
    if (chatFab) {
      chatFab.classList.add('tutorial-pulse')
    }
  } else {
    // Remove pulse from chat FAB
    const chatFab = document.querySelector('.chat-fab')
    if (chatFab) {
      chatFab.classList.remove('tutorial-pulse')
    }
  }
}

// Watch for step changes
watch(currentStepIndex, () => {
  setTimeout(() => {
    positionElements()
    handleStepAction()
  }, 100)
})

// Initialize
onMounted(() => {
  if (isVisible.value) {
    setTimeout(() => {
      positionElements()
      handleStepAction()
    }, 500)
  }
  
  // Reposition on window resize
  window.addEventListener('resize', positionElements)
  window.addEventListener('scroll', positionElements)
})

onUnmounted(() => {
  window.removeEventListener('resize', positionElements)
  window.removeEventListener('scroll', positionElements)
})
</script>

<template>
  <transition name="fade">
    <div v-if="isVisible" class="tutorial-overlay">
      <!-- Dark overlay -->
      <div class="overlay-backdrop" @click="skipTutorial" />
      
      <!-- Spotlight -->
      <div 
        class="spotlight"
        :style="{
          top: highlightPosition.top + 'px',
          left: highlightPosition.left + 'px',
          width: highlightPosition.width + 'px',
          height: highlightPosition.height + 'px'
        }"
      />
      
      <!-- Tooltip -->
      <transition name="slide-fade">
        <v-card
          class="tutorial-tooltip"
          :style="{
            top: tooltipPosition.top + 'px',
            left: tooltipPosition.left + 'px'
          }"
          elevation="12"
        >
          <v-card-text class="pa-4">
            <!-- Progress indicator -->
            <v-progress-linear
              :model-value="progress"
              color="primary"
              height="4"
              rounded
              class="mb-3"
            />
            
            <!-- Step content -->
            <h3 class="text-h6 font-weight-bold mb-2">{{ currentStep.title }}</h3>
            <p class="text-body-2 text-grey100 mb-4">{{ currentStep.description }}</p>
            
            <!-- Navigation -->
            <div class="d-flex justify-space-between align-center">
              <v-btn
                variant="text"
                size="small"
                @click="skipTutorial"
              >
                Skip Tour
              </v-btn>
              
              <div>
                <v-btn
                  v-if="currentStepIndex > 0"
                  variant="text"
                  size="small"
                  @click="previousStep"
                  class="mr-2"
                >
                  <Icon icon="solar:arrow-left-linear" class="mr-1" />
                  Back
                </v-btn>
                
                <v-btn
                  color="primary"
                  variant="flat"
                  size="small"
                  @click="nextStep"
                >
                  {{ currentStepIndex === steps.length - 1 ? 'Finish' : 'Next' }}
                  <Icon 
                    :icon="currentStepIndex === steps.length - 1 ? 'solar:check-circle-linear' : 'solar:arrow-right-linear'" 
                    class="ml-1" 
                  />
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  pointer-events: none;
}

.overlay-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  pointer-events: all;
}

.spotlight {
  position: absolute;
  border-radius: 8px;
  box-shadow: 
    0 0 0 9999px rgba(0, 0, 0, 0.7),
    0 0 20px rgba(255, 255, 255, 0.5);
  pointer-events: none;
  transition: all 0.3s ease-out;
}

.tutorial-tooltip {
  position: absolute;
  width: 320px;
  pointer-events: all;
  z-index: 2001;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .tutorial-tooltip {
    width: calc(100vw - 20px);
    max-width: 320px;
  }
}
</style>