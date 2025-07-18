<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

interface Props {
  userName?: string
}

const props = withDefaults(defineProps<Props>(), {
  userName: 'Student'
})

// State
const showMessage = ref(false)
const messageIndex = ref(0)

// Welcome messages
const messages = [
  {
    icon: 'solar:chat-round-dots-bold-duotone',
    title: 'Your AI Assistant is Ready!',
    text: 'Click the chat button to get instant help with your studies.',
    color: 'primary'
  },
  {
    icon: 'solar:medal-star-bold-duotone',
    title: 'Keep Your Streak Going!',
    text: 'Study a little each day to maintain your streak.',
    color: 'success'
  },
  {
    icon: 'solar:graph-up-bold-duotone',
    title: 'Track Your Progress',
    text: 'Check out your analytics to see how you\'re improving.',
    color: 'info'
  },
  {
    icon: 'solar:cup-star-bold-duotone',
    title: 'Climb the Leaderboard!',
    text: 'Complete more exams to increase your rank.',
    color: 'warning'
  }
]

const currentMessage = computed(() => messages[messageIndex.value])

// Dismiss message
const dismissMessage = () => {
  showMessage.value = false
  // Don't show again today
  const today = new Date().toDateString()
  localStorage.setItem('welcomeMessageDismissed', today)
}

onMounted(() => {
  // Check if message was already dismissed today
  const dismissedDate = localStorage.getItem('welcomeMessageDismissed')
  const today = new Date().toDateString()
  
  if (dismissedDate !== today) {
    // Show message after a short delay
    setTimeout(() => {
      // Select a random message
      messageIndex.value = Math.floor(Math.random() * messages.length)
      showMessage.value = true
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        if (showMessage.value) {
          dismissMessage()
        }
      }, 8000)
    }, 2000)
  }
})
</script>

<template>
  <transition name="slide-down">
    <v-alert
      v-if="showMessage"
      :color="currentMessage.color"
      variant="tonal"
      closable
      @click:close="dismissMessage"
      class="welcome-message mb-4"
      elevation="2"
    >
      <template v-slot:prepend>
        <Icon 
          :icon="currentMessage.icon" 
          size="24"
        />
      </template>
      
      <div>
        <div class="text-subtitle-2 font-weight-bold mb-1">
          {{ currentMessage.title }}
        </div>
        <div class="text-body-2">
          {{ currentMessage.text }}
        </div>
      </div>
    </v-alert>
  </transition>
</template>

<style scoped>
.welcome-message {
  position: relative;
  overflow: hidden;
}

.welcome-message::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.5) 50%, 
    transparent 100%
  );
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Slide down animation */
.slide-down-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-down-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>