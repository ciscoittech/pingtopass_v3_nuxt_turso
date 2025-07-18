<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

interface Notification {
  id: string
  type: 'suggestion' | 'achievement' | 'streak' | 'competitive' | 'reminder' | 'update' | 'insight'
  priority: 'high' | 'medium' | 'low'
  icon: string
  title: string
  message: string
  progress?: number
  action?: {
    label: string
    route: string
  }
  isNew?: boolean
  dismissible: boolean
}

// State
const notifications = ref<Notification[]>([])
const currentIndex = ref(0)
const isExpanded = ref(false)
const isPaused = ref(false)
const loading = ref(true)
const rotationInterval = ref<NodeJS.Timeout | null>(null)

// Computed
const currentNotification = computed(() => notifications.value[currentIndex.value])
const hasNotifications = computed(() => notifications.value.length > 0)

// Fetch notifications
const fetchNotifications = async () => {
  loading.value = true
  try {
    const { data } = await $fetch('/api/notifications/smart')
    
    if (data) {
      notifications.value = data.notifications
      startRotation()
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  } finally {
    loading.value = false
  }
}

// Start notification rotation
const startRotation = () => {
  if (rotationInterval.value) {
    clearInterval(rotationInterval.value)
  }
  
  if (notifications.value.length > 1 && !isPaused.value) {
    rotationInterval.value = setInterval(() => {
      if (!isPaused.value && !isExpanded.value) {
        nextNotification()
      }
    }, 5000) // Rotate every 5 seconds
  }
}

// Stop rotation
const stopRotation = () => {
  if (rotationInterval.value) {
    clearInterval(rotationInterval.value)
    rotationInterval.value = null
  }
}

// Navigate to next notification
const nextNotification = () => {
  currentIndex.value = (currentIndex.value + 1) % notifications.value.length
}

// Navigate to previous notification
const previousNotification = () => {
  currentIndex.value = currentIndex.value === 0 
    ? notifications.value.length - 1 
    : currentIndex.value - 1
}

// Dismiss notification
const dismissNotification = (notificationId: string) => {
  // Save to localStorage (in production, save to DB)
  const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]')
  dismissed.push(notificationId)
  localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed))
  
  // Remove from current list
  notifications.value = notifications.value.filter(n => n.id !== notificationId)
  
  // Adjust current index if needed
  if (currentIndex.value >= notifications.value.length) {
    currentIndex.value = 0
  }
  
  // Restart rotation if needed
  if (notifications.value.length > 0) {
    startRotation()
  }
}

// Handle action click
const handleAction = (notification: Notification) => {
  if (notification.action) {
    navigateTo(notification.action.route)
  }
}

// Get notification color
const getNotificationColor = (type: string) => {
  const colors = {
    suggestion: 'info',
    achievement: 'warning',
    streak: 'orange',
    competitive: 'purple',
    reminder: 'primary',
    update: 'success',
    insight: 'blue'
  }
  return colors[type as keyof typeof colors] || 'grey'
}

// Get priority icon
const getPriorityIcon = (priority: string) => {
  const icons = {
    high: 'solar:danger-circle-bold',
    medium: 'solar:info-circle-bold',
    low: 'solar:help-circle-bold'
  }
  return icons[priority as keyof typeof icons]
}

// Toggle expanded view
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    stopRotation()
  } else {
    startRotation()
  }
}

// Lifecycle
onMounted(() => {
  fetchNotifications()
  
  // Refresh notifications every 5 minutes
  const refreshInterval = setInterval(() => {
    fetchNotifications()
  }, 5 * 60 * 1000)
  
  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
})

onUnmounted(() => {
  stopRotation()
})

// Pause rotation on hover
const handleMouseEnter = () => {
  isPaused.value = true
}

const handleMouseLeave = () => {
  isPaused.value = false
}
</script>

<template>
  <v-expand-transition>
    <div v-if="!loading && hasNotifications" class="smart-notifications">
      <!-- Collapsed View -->
      <v-alert
        v-if="!isExpanded && currentNotification"
        :color="getNotificationColor(currentNotification.type)"
        variant="tonal"
        density="compact"
        class="notification-bar mb-3"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div class="d-flex align-center">
          <!-- Icon -->
          <Icon 
            :icon="currentNotification.icon" 
            size="20" 
            class="mr-3 flex-shrink-0"
          />
          
          <!-- Content -->
          <div class="flex-grow-1 mr-2">
            <div class="d-flex align-center">
              <span class="font-weight-medium mr-2">
                {{ currentNotification.title }}
              </span>
              <v-chip 
                v-if="currentNotification.isNew"
                size="x-small"
                color="error"
                variant="flat"
              >
                NEW
              </v-chip>
            </div>
            <div class="text-caption text-grey100 mt-1">
              {{ currentNotification.message }}
            </div>
            
            <!-- Progress bar if applicable -->
            <v-progress-linear
              v-if="currentNotification.progress"
              :model-value="currentNotification.progress"
              height="3"
              rounded
              :color="getNotificationColor(currentNotification.type)"
              class="mt-2"
              style="max-width: 200px"
            />
          </div>
          
          <!-- Actions -->
          <div class="d-flex align-center">
            <!-- Action button -->
            <v-btn
              v-if="currentNotification.action"
              size="x-small"
              :color="getNotificationColor(currentNotification.type)"
              variant="flat"
              class="mr-2"
              @click="handleAction(currentNotification)"
            >
              {{ currentNotification.action.label }}
            </v-btn>
            
            <!-- Navigation -->
            <div v-if="notifications.length > 1" class="d-flex align-center mr-2">
              <v-btn
                icon
                size="x-small"
                variant="text"
                @click="previousNotification"
              >
                <Icon icon="solar:arrow-left-linear" size="16" />
              </v-btn>
              <span class="text-caption mx-1">
                {{ currentIndex + 1 }}/{{ notifications.length }}
              </span>
              <v-btn
                icon
                size="x-small"
                variant="text"
                @click="nextNotification"
              >
                <Icon icon="solar:arrow-right-linear" size="16" />
              </v-btn>
            </div>
            
            <!-- Expand/Collapse -->
            <v-btn
              icon
              size="x-small"
              variant="text"
              @click="toggleExpanded"
            >
              <Icon :icon="isExpanded ? 'solar:minimize-linear' : 'solar:maximize-linear'" size="16" />
            </v-btn>
            
            <!-- Dismiss -->
            <v-btn
              v-if="currentNotification.dismissible"
              icon
              size="x-small"
              variant="text"
              @click="dismissNotification(currentNotification.id)"
            >
              <Icon icon="solar:close-circle-linear" size="16" />
            </v-btn>
          </div>
        </div>
      </v-alert>
      
      <!-- Expanded View -->
      <v-card v-else-if="isExpanded" elevation="2" class="mb-3">
        <v-card-title class="d-flex align-center justify-space-between pa-3">
          <div class="d-flex align-center">
            <Icon icon="solar:bell-bold-duotone" size="20" class="mr-2" />
            <span class="text-subtitle-1">Notifications</span>
            <v-chip size="x-small" class="ml-2">
              {{ notifications.length }}
            </v-chip>
          </div>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="toggleExpanded"
          >
            <Icon icon="solar:minimize-linear" />
          </v-btn>
        </v-card-title>
        
        <v-divider />
        
        <v-card-text class="pa-2">
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="(notification, index) in notifications"
              :key="notification.id"
              :class="{ 'mb-1': index < notifications.length - 1 }"
              class="notification-item rounded px-2"
            >
              <template v-slot:prepend>
                <v-avatar
                  :color="getNotificationColor(notification.type)"
                  size="32"
                  variant="tonal"
                >
                  <Icon :icon="notification.icon" size="16" />
                </v-avatar>
              </template>
              
              <v-list-item-title class="text-body-2">
                {{ notification.title }}
                <Icon 
                  v-if="notification.priority === 'high'"
                  :icon="getPriorityIcon(notification.priority)"
                  size="14"
                  color="error"
                  class="ml-1"
                />
              </v-list-item-title>
              
              <v-list-item-subtitle class="text-caption">
                {{ notification.message }}
              </v-list-item-subtitle>
              
              <template v-slot:append>
                <div class="d-flex align-center">
                  <v-btn
                    v-if="notification.action"
                    size="x-small"
                    variant="text"
                    :color="getNotificationColor(notification.type)"
                    @click="handleAction(notification)"
                  >
                    {{ notification.action.label }}
                  </v-btn>
                  <v-btn
                    v-if="notification.dismissible"
                    icon
                    size="x-small"
                    variant="text"
                    @click="dismissNotification(notification.id)"
                  >
                    <Icon icon="solar:close-linear" size="14" />
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </div>
  </v-expand-transition>
</template>

<style scoped>
.smart-notifications {
  position: relative;
}

.notification-bar {
  cursor: pointer;
  transition: all 0.3s ease;
  animation: slideInDown 0.5s ease-out;
}

.notification-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.notification-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Priority pulse animation */
@keyframes priorityPulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.notification-item:has(.text-error) {
  animation: priorityPulse 2s ease-in-out infinite;
}

/* Slide in animation */
@keyframes slideInDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Notification rotation animation */
@keyframes notificationRotate {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  10% {
    opacity: 1;
    transform: translateX(0);
  }
  90% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-20px);
  }
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .notification-bar {
    font-size: 0.875rem;
  }
  
  .notification-bar .v-btn {
    display: none;
  }
  
  .notification-bar .text-caption {
    display: none;
  }
}
</style>